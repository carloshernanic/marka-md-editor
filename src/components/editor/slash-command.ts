import { Extension, type Editor, type Range } from "@tiptap/core";
import { ReactRenderer } from "@tiptap/react";
import Suggestion, { type SuggestionProps } from "@tiptap/suggestion";
import { SlashMenu, type SlashMenuRef, type SlashMenuProps } from "./SlashMenu";
import { filterSlashItems, type SlashItem } from "./slash-items";

export const SlashCommand = Extension.create({
  name: "slashCommand",

  addProseMirrorPlugins() {
    return [
      Suggestion<SlashItem, SlashItem>({
        editor: this.editor,
        char: "/",
        startOfLine: false,
        allowSpaces: false,
        placement: "bottom-start",
        offset: { mainAxis: 8, crossAxis: 0 },
        command: ({ editor, range, props }: { editor: Editor; range: Range; props: SlashItem }) => {
          props.command({ editor, range });
        },
        items: ({ query }) => filterSlashItems(query),
        allow: ({ state, range }) => {
          // Only allow inside text blocks that are not code blocks.
          const $from = state.doc.resolve(range.from);
          return $from.parent.type.name !== "codeBlock";
        },
        render: () => {
          let component: ReactRenderer<SlashMenuRef, SlashMenuProps> | null = null;
          let unmount: (() => void) | null = null;

          return {
            onStart: (props: SuggestionProps<SlashItem, SlashItem>) => {
              component = new ReactRenderer(SlashMenu, {
                props: { items: props.items, command: props.command },
                editor: props.editor,
              });
              unmount = props.mount(component.element as HTMLElement);
            },
            onUpdate: (props: SuggestionProps<SlashItem, SlashItem>) => {
              component?.updateProps({ items: props.items, command: props.command });
            },
            onKeyDown: (props) => {
              if (props.event.key === "Escape") {
                unmount?.();
                unmount = null;
                return true;
              }
              return component?.ref?.onKeyDown(props) ?? false;
            },
            onExit: () => {
              unmount?.();
              unmount = null;
              component?.destroy();
              component = null;
            },
          };
        },
      }),
    ];
  },
});
