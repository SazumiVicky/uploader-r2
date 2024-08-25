# AWS S3 | Cloudflare r2 - UPLOADER

This project is a web-based file uploader built with Node.js, Express, and AWS S3 | Cloudflare r2. It allows users to upload files with a size limit of 50MB and provides a simple interface for managing uploads.

## Features

- File upload with a size limit of 50MB
- File storage on AWS S3 | Cloudflare r2
- Simple and clean user interface
- Donation popup for user contributions

## Technologies Used

- Node.js
- Express
- AWS S3 | Cloudflare r2
- Multer
- HTML/CSS/JavaScript

## Installation

1. Clone the repository:
    ```sh
    git clone https://github.com/SazumiVicky/uploader-r2.git
    cd uploader-r2
    ```

2. Install the dependencies:
    ```sh
    npm install --save
    ```

3. Create a `.env` file in the root directory and add your AWS S3 credentials:
    ```env
    AWS_ACCESS_KEY_ID=
    AWS_SECRET_ACCESS_KEY=
    AWS_REGION=auto
    CLOUDFLARE_ENDPOINT=
    BUCKET_NAME=
    ```
Full documentation here [AWS S3 | Cloudflare r2](https://developers.cloudflare.com/r2/examples/aws/)

4. Start the server:
    ```sh
    npm start
    ```

5. Open your browser and navigate to `http://localhost:3000`.

## Usage

1. Select a file to upload using the file input.
2. Click the "Upload" button to start the upload process.
3. Wait for the upload to complete and see the status message.
4. The uploaded file URL will be displayed in the upload history.

## File Structure

- `public/`: Contains static files (HTML, CSS, JavaScript)
- `server.js`: Main server file
- `Dockerfile`: Docker configuration
- `package.json`: Project dependencies and scripts

## Api Docs Example

```js
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');

async function sazumiCdn(filePath) {
  const formData = new FormData();
  formData.append('fileInput', fs.createReadStream(filePath));

  try {
    const response = await fetch('https://localhost:3000/upload', {
      method: 'POST',
      body: formData
    });

    if (response.ok) {
      const fileUrl = await response.json(); // Change from response.text() to response.json()
      console.log('Succesfully:', fileUrl);
    } else {
      const errorResponse = await response.json(); // Change from response.statusText to response.json()
      console.error('oops something went wrong:', errorResponse);
    }
  } catch (error) {
    console.error('oops something went wrong:', error.message);
  }
}

// Example usage:
sazumiCdn('/path/to/your/file.jpg');
```
## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.

## Author

Developed by Sazumi Viki

- [Instagram](https://www.instagram.com/moe.sazumiviki)
- [GitHub](https://github.com/sazumivicky)
- [Website](https://sazumi.moe)