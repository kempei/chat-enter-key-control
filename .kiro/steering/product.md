# プロダクト概要

## Chat Enter Key Control

日本語入力時のEnterキー誤送信を防止するChrome拡張機能。

## 主な機能

- **IME入力中のEnter防止**: 日本語入力時にEnterキーで漢字変換を確定した際の誤送信を防止
- **改行挿入**: IME入力中のEnterキーで改行を挿入
- **修飾キー送信**: Ctrl+Enter、Alt+Enter、Cmd+Enter、Opt+Enterでメッセージを送信
- **URLパターン管理**: 特定のサイトで機能を有効化/無効化
- **自動フィールド検出**: テキスト入力フィールド（textarea、input、contenteditable）を自動検出
- **設定の永続化**: chrome.storage.syncを使用した設定の保存

## 対象ユーザー

日本語でWebベースのチャットアプリケーション（ChatGPT、Slack、Discordなど）を使用するユーザー。

## 開発アプローチ

仕様駆動開発（Spec-Driven Development）を採用。`.kiro/specs/chat-enter-key-control/`に要件定義、設計書、実装計画を配置。
