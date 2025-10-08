const multer = require('multer');
const path = require('path');
const crypto = require('crypto');


const storage = multer.diskStorage({
    destination: function (req, file, cb){
        let folder = 'public/images/other';

        if(file.fieldname === 'coverImage'){
            folder = 'public/images/books';
        }
        else if(file.fieldname === 'aadharFrontImage' || file.fieldname === 'aadharBackImage'){
            folder = 'public/images/sellerAadhar';
        }

        cb(null, folder);
    },
    filename: function (req, file, cb){
        crypto.randomBytes(12, function(err, bytes){
            const fn = bytes.toString("hex") + path.extname(file.originalname);
            cb(err, fn);
        })
    }
});

const upload = multer({ storage: storage })

module.exports = upload;