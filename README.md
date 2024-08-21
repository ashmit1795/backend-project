
# Playtube - A Video Hosting Platform Backend

Playtube is a fully-featured backend project that replicates the core functionalities of a video hosting platform, similar to YouTube. Built with Node.js, Express.js, MongoDB, and Mongoose, Playtube provides a robust foundation for managing users, videos, likes, comments, and more. This project follows industry-standard practices, such as JWT for authentication, bcrypt for password hashing, and support for both access and refresh tokens.


## Features

- **User Authentication:** Secure login and signup using JWT and bcrypt.
- **Video Management:** Users can upload, view, and manage their videos, including the ability to upload thumbnails.
- **Social Interactions:** Users can like, dislike, comment on videos, reply to comments, and subscribe or unsubscribe from channels.
- **Community Posts:** Users can upload tweets, similar to YouTube's community posts. Tweets can be liked and commented on by other users.
- **Search Functionality:** Search videos based on keywords and tags using MongoDB's *$text* and *$regex* operators.
- **API Documentation:** Comprehensive API testing with a Postman collection available for easy testing.

This project follows industry-standard practices, ensuring code quality and maintainability.
## Tech Stack

- **Node.js & Express.js:** For building the RESTful API.

- **MongoDB & Mongoose:** As the database and ORM, providing schema-based data modeling and aggregation.

- **JWT & Bcrypt:** For secure authentication and password encryption.

- **Multer & Cloudinary:** For handling file uploads, such as video files and thumbnails.

- **Standard Practices:** Access tokens, refresh tokens, error handling, and secure routes for a professional-grade backend system.

- **Postman:** For API testing and documentation.


## Installation

1. **Clone the repository:**

```bash
git clone https://github.com/ashmit1795/backend-project.git
cd backend-project
```

2. **Install dependencies:**
```bash
npm install
```
3. **Set up environment variables:**
To run this project, you will need to add the following environment variables to your .env file
```bash
PORT=3000
MONGODB_URL=yourmongourl
CORS_ORIGIN=*
ACCESS_TOKEN_SECRET=youraccesstokensecret
ACCESS_TOKEN_SECRET_EXPIRES_IN=expirydays
REFRESH_TOKEN_SECRET=yourrefreshtokensecret
REFRESH_TOKEN_SECRET_EXPIRES_IN=expirydays

CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

4. **Start the development server**
```bash
npm run dev
```
The server will run on http://localhost:3000/
    
## API Documentation

The API endpoints for this project can be tested using the provided Postman collection. You can download the Postman collection from the following link:

[Download Postman Collection](https://api.postman.com/collections/32382436-91d25735-25e7-4298-838b-c5cd53ed1147?access_key=PMAT-01J5V4ABBB5WWZ2GZJDZDZ0Y1N)

The collection includes all necessary requests for user authentication, video management, and other features.
## Learning Source

This project was developed as part of the Chai aur Backend series by Hitesh Choudhary (YouTube channel: Chai aur Code). The series provided a solid foundation in backend development, and this project serves as an assignment to put the concepts into practice.

## Conclusion

Playtube represents a significant step in mastering backend development, encompassing essential features and modern practices. It’s a comprehensive project showcasing the power of Node.js and Express.js in building scalable and secure web applications.

Feel free to explore the project and its codebase, and use the provided Postman collection for API testing!


