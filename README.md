# YouTube Backend with Express and Node.js

Welcome to the backend of YouTube built with Express and Node.js! This backend provides a robust API for managing users, videos, tweets, playlists, comments, and more. It leverages MongoDB's aggregation pipeline for efficient data processing.

🎥🔧🚀

## Features

- **User Management**: Add, delete, update, and remove users.
- **Video Management**: CRUD operations for videos.
- **Tweet Management**: Manage tweets associated with videos.
- **Playlist Management**: Create, update, and delete playlists.
- **Comment System**: Add, delete, update comments for videos.

## Installation

1. **Clone the Repository:**
   ```
   git clone https://github.com/your_username/youtube-backend.git
   cd youtube-backend
   ```

2. **Install Dependencies:**
   ```
   npm install
   ```

3. **Set Up Environment Variables:**
   Create a `.env` file in the root directory and add the following variables:
   ```
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/youtube
   PORT = 8000 // port on which your application is listening
   CORS_ORIGIN= // Origin of the CORS header
   ACCESS_TOKEN_SECRET = // your access token secret
   ACCESS_TOKEN_EXPIRY = // your access token expiry
   REFRESH_TOKEN_SECRET = // your refresh token secret
   REFRESH_TOKEN_EXPIRY = // your refresh token expiry
   CLOUDINARY_NAME=  // your cloudinary name
   CLOUDINARY_APIKEY= // your cloudinary API key
   CLOUDINARY_API_SCERET= // your cloudinary API secret

   ```

   Note: Adjust the All URI , API keys & Secrets according to your setup.

4. **Start the Server:**
   ```
   npm run dev
   ```


## Features

- **User Management**:
- **Video Management**:
- **Tweet Management**:
- **Playlist Management**:
- **Comment System**:
- 
### Aggregation Pipeline

This backend utilizes MongoDB's aggregation pipeline for advanced data processing, allowing efficient querying and manipulation of data.

## Contributors

- Karan Sharma(@walkerbuddy01)


🌟 Thank you for using YouTube Backend! Happy coding! 🌟
