# Identidade do Marka

O Marka é um editor visual de Markdown com salvamento no navegador. A identidade
traduz essa proposta em um **M compacto**, com diagonais que sugerem uma página
dobrada e um recorte no canto inferior direito. A assinatura usa Geist, a mesma
família tipográfica da interface, convertida em curvas para não depender de fontes
instaladas.

A referência é a simplicidade monocromática do [brand kit da Resend](https://resend.com/brand).
O símbolo do Marka tem desenho próprio.

## Arquivos

- `marka-logo-black.svg`: assinatura completa para fundos claros.
- `marka-logo-white.svg`: assinatura completa para fundos escuros.
- `marka-symbol-black.svg`: símbolo isolado para fundos claros.
- `marka-symbol-white.svg`: símbolo isolado para fundos escuros.
- `marka-preview.png`: apresentação das versões positiva e negativa.

Todos os SVGs têm fundo transparente e letras em curvas. Preserve a proporção,
use uma única cor e reserve ao redor pelo menos um quarto da altura do símbolo.
Tamanho mínimo recomendado: 108 px de largura para a assinatura e 20 px para o
símbolo isolado. Para abas do navegador, use o favicon preparado em 16, 32 e 48 px.

## Aplicação

`src/components/BrandLogo.tsx` renderiza as curvas de `src/lib/brand.json` com
`currentColor`, acompanhando o tema da interface. A propriedade `symbolOnly`
seleciona o monograma. O componente possui nome acessível “Marka”.

Os ícones ficam em `src/app/icon.svg`, `src/app/favicon.ico` e
`src/app/apple-icon.png` (180 × 180 px), seguindo as convenções de metadata do
Next.js. Ao alterar as curvas, mantenha os SVGs e ícones exportados sincronizados.
