# 🌍 EnviroGuardian

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black)](https://vercel.com)
[![Mobile-first](https://img.shields.io/badge/Mobile--first-Yes-green)](https://enviroguardian.app)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.30-black)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-blue)](https://www.typescriptlang.org)

EnviroGuardian is a real-time environmental risk assistant that uses camera input, AI models, and public data to warn users about pollution and provide smart suggestions. Built for the Google Cloud hackathon.

## ✨ Features

- 📷 Camera-based AR overlay with real-time AQI readings
- 📍 Location-based environmental alerts
- 🔔 Smart push notifications
- 🧠 AI-powered environmental advisor
- 🔍 Vector search for historical data
- 🌍 Interactive pollution heatmap
- 📈 Insights dashboard with trends
- 👨‍💼 Admin panel for data management

## 🚀 Tech Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS, ShadCN UI
- **Backend**: Next.js API Routes
- **AI/ML**: HuggingFace, Custom GPT models
- **Database**: MongoDB Atlas with Vector Search
- **Maps**: Leaflet.js
- **Notifications**: Firebase Cloud Messaging
- **Deployment**: Vercel

## 🛠️ Local Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/enviroguardian.git
   cd enviroguardian
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```
   Fill in your API keys and configuration values.

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🚀 Deployment on Vercel

1. **Push your code to GitHub**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/enviroguardian.git
   git push -u origin main
   ```

2. **Import your project to Vercel**

   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Configure the project settings

3. **Set up Environment Variables**

   Add the following environment variables in the Vercel project settings:

   - `NEXT_PUBLIC_OPENAQ_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_CONFIG`
   - `NEXT_PUBLIC_FIREBASE_VAPID_KEY`
   - `NEXT_PUBLIC_OPENWEATHER_API_KEY`
   - `HUGGINGFACE_API_KEY`
   - `MONGODB_URI`

4. **Deploy**

   Click "Deploy" and wait for the build to complete.

## 📱 Mobile Support

EnviroGuardian is built with a mobile-first approach and supports:
- Camera-based AR features
- GPS location services
- Push notifications
- Responsive design for all screen sizes

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

```env
NEXT_PUBLIC_OPENAQ_API_KEY=your_openaq_api_key
NEXT_PUBLIC_FIREBASE_CONFIG=your_firebase_config_json_string
NEXT_PUBLIC_FIREBASE_VAPID_KEY=your_firebase_vapid_key
NEXT_PUBLIC_OPENWEATHER_API_KEY=your_openweather_api_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
MONGODB_URI=your_mongodb_uri
```

## 🧪 Testing

Run the test suite:
```bash
npm test
```

