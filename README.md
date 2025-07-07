# Dooit - Modern To-Do List App

![Dooit Logo](./assets/images/app-icon-all.png)

A powerful and user-friendly to-do list application built with React Native and Parse Server. Dooit helps you stay organized and productive with its intuitive interface and robust features.

## 🚀 Features

### Core Features
- 📝 Task Management
  - Create, edit, and delete tasks
  - Mark tasks as complete/incomplete
  - Add task descriptions and due dates
  - Real-time synchronization

- 🔐 User Authentication
  - Email/password sign-up and login
  - Persistent user sessions
  - Secure task storage

### Advanced Features
- ⚡ Real-time Updates
  - Automatic task list refresh
  - Instant task changes
  - Cross-device sync

- 📅 Calendar Integration
  - View tasks by date
  - Set task reminders
  - Monthly/weekly views

- 🎨 User Interface
  - Clean and modern design
  - Responsive layout
  - Intuitive navigation
  - Dark/light theme support

## 🛠 Tech Stack

- **Frontend**
  - React Native with Ignite
  - Expo SDK
  - React Navigation
  - MobX State Tree

- **Backend**
  - Parse Server
  - MongoDB
  - Parse LiveQuery

## 📱 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Expo CLI
- Git
- Android Studio / Xcode (for native development)

### Installation

1. Clone the repository
```bash
git clone [repository-url]
cd dooit
```

2. Install dependencies
```bash
yarn install
```

3. Configure Parse Server
- Set up your Parse Server instance
- Update environment variables in `.env` file

4. Start the development server
```bash
yarn start
```

## 📱 Running the App

### Development
```bash
# Start development server
yarn start

# Run on iOS simulator
yarn ios

# Run on Android emulator
yarn android
```

### Production Build
```bash
# Build for iOS simulator
yarn build:ios:sim

# Build for iOS device
yarn build:ios:dev

# Build for production
yarn build:ios:prod
```

## 📂 Project Structure

```tree
app/
├── assets/         # App assets (images, fonts, etc.)
├── components/     # Reusable UI components
├── screens/        # Screen components
├── services/       # Parse Server integration
├── stores/         # MobX stores
├── styles/         # Global styles
└── utils/         # Utility functions
```

## 📱 Assets Directory

This directory is organized to store various app assets:

```tree
assets
├── icons/         # App icons and UI icons
└── images/        # Background images and other graphics
```

### Using Assets

```typescript
import { Image } from 'react-native';

const MyComponent = () => {
  return (
    <Image source={require('../assets/images/my_image.png')} />
  );
};
```

## Running Maestro end-to-end tests

Follow our [Maestro Setup](https://ignitecookbook.com/docs/recipes/MaestroSetup) recipe.

## Next Steps

### Ignite Cookbook

[Ignite Cookbook](https://ignitecookbook.com/) is an easy way for developers to browse and share code snippets (or “recipes”) that actually work.

### Upgrade Ignite boilerplate

Read our [Upgrade Guide](https://ignitecookbook.com/docs/recipes/UpdatingIgnite) to learn how to upgrade your Ignite project.

## Community

⭐️ Help us out by [starring on GitHub](https://github.com/infinitered/ignite), filing bug reports in [issues](https://github.com/infinitered/ignite/issues) or [ask questions](https://github.com/infinitered/ignite/discussions).

💬 Join us on [Slack](https://join.slack.com/t/infiniteredcommunity/shared_invite/zt-1f137np4h-zPTq_CbaRFUOR_glUFs2UA) to discuss.

📰 Make our Editor-in-chief happy by [reading the React Native Newsletter](https://reactnativenewsletter.com/).
