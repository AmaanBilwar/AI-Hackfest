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
      + [Google API Setup](#google-api-setup)
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
### Google API Setup

1. **Go to Google Cloud Console**
   - Visit [https://console.cloud.google.com/](https://console.cloud.google.com/)
   - Sign in with your Google account

2. **Create or Select a Project**
   - Click on the project dropdown at the top of the page
   - Click "New Project" or select an existing one
   - Give your project a name (e.g., "SafeStep")
   - Click "Create"

3. **Generate an API Key**
   - In the left sidebar, navigate to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Your new API key will be displayed - copy it to a secure location

4. **Restrict Your API Key** (Recommended for security)
   - In the API keys section, find your newly created key and click "Edit"
   - Under "Application restrictions", choose appropriate options (HTTP referrers, IP addresses, etc.)
   - Under "API restrictions", select the specific APIs you want to use
   - Click "Save"

5. **Enable Required APIs**
   - In the left sidebar, go to "APIs & Services" > "Library"
   - Search for and enable each API:
     - Maps Datasets API: Allows you to programmatically create and manage custom map features
     - Street View Publish API: Enables publishing 360° photos to Google Street View
     - Maps Embed API: Lets you embed Google Maps in web pages using a simple HTML tag
     - Maps JavaScript API: Provides interactive maps with custom content and imagery for websites
     - Maps Static API: Delivers map images via HTTP requests without requiring JavaScript
     - Places API: Offers detailed information about points of interest, businesses, and geographical locations
     - Geocoding API: Converts addresses to geographic coordinates and vice versa
     - Geolocation API: Determines a user's location based on network signals
     - Directions API: Provides route planning and navigation instructions between locations
     - Routes API: Offers optimized routing for complex journeys and delivery planning
     - Distance Matrix API: Calculates travel times and distances between multiple origins and destinations
     - Maps SDK for Android: Integrates Google Maps functionality into Android applications
     - Maps SDK for iOS: Integrates Google Maps functionality into iOS applications

6. **Set Up Billing** (Required for most Google APIs)
   - Many APIs require billing to be enabled
   - Go to "Billing" in the left sidebar
   - Set up a billing account if you haven't already

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
