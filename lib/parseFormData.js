import { IncomingForm } from 'formidable';
import fs from 'fs';

export const parseFormData = (req) =>
  new Promise((resolve, reject) => {
    const form = new IncomingForm({ multiples: true, uploadDir: './public/uploads', keepExtensions: true });

    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      resolve({ fields, files });
    });
  });

export const config = {
  api: {
    bodyParser: false,
  },
};
