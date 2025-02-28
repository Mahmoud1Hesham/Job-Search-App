import multer from 'multer';


export const fileValidationTypes = {
    image: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'],
    document: ['application/json', 'application/pdf', 'application/text']
}


export const uploadCloudFile = ( fileValidation = []) => {

    
    const storage = multer.diskStorage({})

    function fileFilter(req, file, cb) {
        if (fileValidation.includes(file.mimetype)) {
            cb(null, true)
        } else {
            cb("invalid file format", false)
        }
    }

    return multer({ dest: 'dest', fileFilter, storage })
}