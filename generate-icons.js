// SVGからPNGアイコンを生成するスクリプト
// sharpライブラリを使用してSVGを各サイズのPNGに変換

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * SVGファイルを指定サイズのPNGに変換
 * @param {string} svgPath - SVGファイルのパス
 * @param {string} outputPath - 出力PNGファイルのパス
 * @param {number} size - 出力サイズ（幅と高さ）
 */
async function convertSvgToPng(svgPath, outputPath, size) {
  try {
    await sharp(svgPath)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✓ ${outputPath} を生成しました (${size}x${size})`);
  } catch (error) {
    console.error(`✗ ${outputPath} の生成に失敗しました:`, error.message);
    throw error;
  }
}

/**
 * メイン処理
 */
async function main() {
  const iconsDir = path.join(__dirname, 'icons');
  const svgPath = path.join(iconsDir, 'icon.svg');

  // SVGファイルの存在確認
  if (!fs.existsSync(svgPath)) {
    console.error(`エラー: ${svgPath} が見つかりません`);
    process.exit(1);
  }

  // 各サイズのPNGを生成
  const sizes = [16, 48, 128];
  
  console.log('SVGからPNGアイコンを生成中...\n');
  
  for (const size of sizes) {
    const outputPath = path.join(iconsDir, `icon${size}.png`);
    await convertSvgToPng(svgPath, outputPath, size);
  }

  console.log('\n✓ すべてのアイコンが正常に生成されました！');
}

// スクリプト実行
main().catch(error => {
  console.error('エラーが発生しました:', error);
  process.exit(1);
});
