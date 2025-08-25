const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const uploadFolder = path.resolve(__dirname, '..', '..', 'tmp', 'uploads');

module.exports = {
    directory: uploadFolder,
    storage: multer.diskStorage({
        destination: uploadFolder,
        filename(request, file, callback) {
            // Gera um nome de arquivo único para evitar conflitos
            const fileHash = crypto.randomBytes(10).toString('hex');

            const fileName = fileHash;

            callback(null, fileName);
        },
    }),
    limits: {
        fileSize: 2 * 1024 * 1024, // Limite de 2MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimes = [
            'image/jpeg',
            'image/pjpeg',
            'image/png',
            'image/gif',
        ];

        if (allowedMimes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de arquivo inválido.'));
        }
    },
};