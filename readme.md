# SafeStep

SafeStep is an intelligent navigation assistant that provides accessible and detailed directions using natural language processing and real-time location data. It helps users navigate to their destinations with clear, step-by-step instructions and voice guidance.

## Table of Contents

- [SafeStep](#safestep)
   * [🚀 Features](#-features)
   * [🛠️ Tech Stack](#-tech-stack)
      + [Frontend](#frontend)
      + [Backend](#backend)
   * [📋 Prerequisites](#-prerequisites)
   * [🚀 Getting Started](#-getting-started)
      + [Frontend Setup](#frontend-setup)
      + [Backend Setup](#backend-setup)
   * [🔧 API Endpoints](#-api-endpoints)
   * [📦 Project Structure](#-project-structure)
   * [🤝 Contributing](#-contributing)
   * [📝 License](#-license)
   * [👥 Authors](#-authors)
   * [🙏 Acknowledgments](#-acknowledgments)

## 🚀 Features

- Natural language processing for direction requests
- Real-time location-based navigation
- Detailed step-by-step directions
- Text-to-speech functionality for voice guidance
- Accessible navigation instructions
- Support for multiple transportation modes
- Fallback handling for unclear destinations
- MongoDB integration for storing navigation history

## 🛠️ Tech Stack

### Frontend
- Next.js 15.3.0
- React 19
- TypeScript
- Tailwind CSS
- Radix UI Components
- Socket.io Client for real-time updates

### Backend
- Flask
- Python 3.x
- MongoDB for data persistence
- Google Maps API for navigation
- Google Gemini AI for natural language processing
- OpenAI for text-to-speech capabilities

## 📋 Prerequisites

- Node.js (Latest LTS version)
- Python 3.x
- MongoDB
- Google Maps API Key
- Google Gemini API Key
- OpenAI API Key

## 🚀 Getting Started

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file with the following variables:
```
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
GOOGLE_MAPS_API_KEY=your_google_maps-api_key
```

4. Start the development server:
```bash
npm run dev
```

### Backend Setup

1. Navigate to the src directory:
```bash
cd src
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
- Windows:
```bash
.\venv\Scripts\activate
```
- Unix/MacOS:
```bash
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create a `.env` file with the following variables:
```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
MONGO_URI=your_mongodb_uri
```

6. Start the Flask server:
```bash
python app.py
```

## 🔧 API Endpoints

- `GET /`: Health check endpoint
- `POST /api/get-directions`: Get navigation directions
- `POST /api/save-directions`: Save navigation history
- `POST /api/text-to-speech`: Convert directions to speech
- `POST /api/get-accessible-directions`: Get accessible navigation instructions
- `POST /api/save-transcript`: Save navigation transcripts

## 📦 Project Structure

```
SafeStep/
├── frontend/               # Next.js frontend application
│   ├── src/               # Source files
│   ├── public/            # Static files
│   └── package.json       # Frontend dependencies
├── src/                   # Backend application
│   ├── app.py            # Main Flask application
│   ├── utils/            # Utility functions
│   │   ├── directions.py # Navigation logic
│   │   └── gemini_utils.py # AI processing
│   └── requirements.txt  # Python dependencies
└── README.md             # Project documentation
```

## 🤝 Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes (feel free to add new features that you think would help the users.)
4. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 👥 Authors

- Amaan Bilwar
- Sampreeth Addakula 

## 🙏 Acknowledgments

- Google Maps API
- Google Gemini AI
- OpenAI
- Next.js team
- Flask team
- All contributors and supporters
