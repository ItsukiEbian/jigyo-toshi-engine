# 新規事業投資エンジン

新規事業の投資判断アルゴリズムを、縦型フローチャートで体験・調整できるシミュレーターです。入力値と判定基準を変えると、計算結果と PASS / KILL がリアルタイムに更新されます。

## 動かし方

```bash
npm install
npm run dev
```

ブラウザで表示されたアドレス（通常は `http://localhost:5173`）を開きます。

## ビルド

```bash
npm run build
npm run preview
```

成果物は `dist/` です。静的ホストにそのまま置けます。

## デプロイ（Vercel）

1. このフォルダ `investment-simulator` をプロジェクトのルートにする
2. フレームワークは Vite、出力ディレクトリは `dist`
3. このリポジトリ配下に置く場合は、Vercel の Root Directory を `investment-simulator` に設定する
