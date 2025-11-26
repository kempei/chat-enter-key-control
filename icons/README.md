# アイコンファイル

このディレクトリには、Chrome拡張機能のアイコンファイルが含まれています。

## アイコンの生成

SVGファイルからPNGファイルを生成するには、以下のコマンドを使用してください：

### ImageMagickを使用する場合

```bash
# icon16.pngを生成
convert -background none -resize 16x16 icon.svg icon16.png

# icon48.pngを生成
convert -background none -resize 48x48 icon.svg icon48.png

# icon128.pngを生成
convert -background none -resize 128x128 icon.svg icon128.png
```

### Inkscapeを使用する場合

```bash
# icon16.pngを生成
inkscape icon.svg --export-filename=icon16.png --export-width=16 --export-height=16

# icon48.pngを生成
inkscape icon.svg --export-filename=icon48.png --export-width=48 --export-height=48

# icon128.pngを生成
inkscape icon.svg --export-filename=icon128.png --export-width=128 --export-height=128
```

### オンラインツールを使用する場合

以下のようなオンラインツールでSVGをPNGに変換できます：
- https://cloudconvert.com/svg-to-png
- https://convertio.co/svg-png/

## アイコンのデザイン

- 青い背景に白い「⏎」（Enterキー）シンボル
- 右上に緑のチェックマーク（機能が有効であることを示す）
- アクティブ/非アクティブ状態を示すために、後で異なるバージョンを作成可能
