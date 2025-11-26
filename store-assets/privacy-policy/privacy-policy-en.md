# Privacy Policy

Last Updated: November 26, 2024

## Introduction

Chat Enter Key Control (hereinafter "the Extension") is a Chrome extension that prevents accidental message sending during Japanese IME input. This Privacy Policy explains how the Extension handles user data.

## 1. Data Collection

The Extension collects only the following data:

- **URL Patterns**: URL patterns of websites where users enable the Extension
- **Send Key Settings**: User-selected send key combinations (Ctrl+Enter, Alt+Enter, Cmd+Enter, Opt+Enter)

### Collection Method

This data is collected only when users explicitly configure it through the Extension's popup UI.

### Data Not Collected

The Extension does NOT collect the following data:

- User input content (chat messages, text input, etc.)
- Browsing history
- Personally identifiable information (name, email address, phone number, etc.)
- Cookies or tracking information

## 2. Data Storage

### Storage Location

Collected data is stored only in Chrome browser's local storage (`chrome.storage.sync`).

### Storage Duration

Data is stored until the user uninstalls the Extension or deletes it from the popup UI.

### External Server Transmission

The Extension does NOT transmit collected data to external servers. All data is stored only within the user's browser.

## 3. Data Usage

Collected data is used only for the following purposes:

- **URL Patterns**: To enable or disable the Extension on specific websites
- **Send Key Settings**: To allow users to send messages with their selected key combinations

This data is used solely for the Extension's operational settings and is not used for any other purposes.

## 4. Third-Party Data Sharing

The Extension does NOT share collected data with third parties. Data is stored only within the user's browser and is never transmitted externally.

## 5. User Rights

### Data Access

Users can view their stored URL patterns and send key settings at any time by opening the Extension's popup UI.

### Data Deletion

Users can delete their data through the following methods:

- Delete individual URL patterns from the popup UI
- Uninstall the Extension
- Clear the Extension's data from Chrome settings

### Data Export

Users can export their settings data in JSON format using the "Export" feature in the popup UI.

## 6. Security

The Extension implements the following security measures:

- All data is stored in browser's local storage and is not transmitted externally
- Code is not obfuscated and is publicly available on GitHub
- Does not load external JavaScript libraries
- Requests only the minimum necessary permissions

## 7. Permission Usage

The Extension uses the following permissions:

- **storage**: Used to save user settings (URL patterns, send key settings)
- **activeTab**: Used to retrieve current tab URL information for URL pattern matching
- **host_permissions (`<all_urls>`)**: Used to allow users to use the Extension on any website

These permissions are the minimum necessary for the Extension's operation.

## 8. Children's Privacy

The Extension is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13.

## 9. Privacy Policy Changes

This Privacy Policy may be updated as necessary. When changes are made, the "Last Updated" date on this page will be updated.

## 10. Contact

If you have any questions or comments about this Privacy Policy, please contact us through the GitHub repository's Issues page.

GitHub Issues: https://github.com/[username]/chat-enter-key-control/issues

---

By using the Extension, you agree to this Privacy Policy.
