# Palaviva - Language Learning App

**Palaviva** is a web application designed to facilitate language learning through reading and active engagement. 

It allows users to import or load articles and any text content for study, classify vocabulary by comfort level, track learning statistics and progress over time, and leverage synchronized text-to-speech for immersive pronunciation practice.

> **Note:** This tool is still under active development and may contain bugs or incomplete features. Contributions, feedback, and suggestions are welcome to help improve the project.

![image](https://github.com/user-attachments/assets/012d603b-818b-4550-ab39-587b5a265246)
![image](https://github.com/user-attachments/assets/e4a3babd-fd89-450d-a54b-77bd54b39509)

## Features

- **Article and Text Import**  
  Load articles or paste custom text for study in your target language.

- **Comfort-Level Classification**  
  Mark each word with a comfort rating to indicate your familiarity, and filter content accordingly.

- **Learning Statistics**  
  View detailed statistics on word frequency, comfort distribution, and your learning progress over time.

- **Synchronized Text-to-Speech**  
  Listen to the full text or individual words and see the current word highlighted in real time.

- **Offline-First Experience**  
  Powered by IndexedDB (Dexie.js) for fast, reliable access to your data without an internet connection.

## Technology Stack

- **Next.js** (App Router, Client Components)  
- **React** with **TypeScript** for type-safe UI  
- **Tailwind CSS** for utility-first styling  
- **Dexie.js** for IndexedDB data management  
- **Web Speech API** for text-to-speech functionality  
- Clean, modular architecture for extensibility

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jancarauma/palaviva.git
   ```
2. Install dependencies:
   ```bash
   cd palaviva
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

- Navigate to the **Create Article** page to import or paste the text you want to study.  
- Open **Articles** to review your loaded texts, classify words, and add translations.  
- Click the **Play** button to listen to the text with synchronized word highlighting.  
- Use the **Create** page to add any custom text you wish to study.  
- Open **Words** to view your vocabulary list and learning statistics.  
- Access **Settings** to configure your native and target languages, page size, and other preferences.  

## Contributing

We welcome contributions to improve Palaviva:

- Follow the [MIT License](#license) for usage and distribution.
- Use [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.
- Open issues to report bugs or request features.
- Submit pull requests with clear descriptions and tests where applicable.

## License

This project is licensed under the MIT License. See the [LICENSE](./LICENSE) file for details.
