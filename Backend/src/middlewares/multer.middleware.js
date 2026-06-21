import multer from "multer";
import fs from "fs"; //  Ye import karna zaroori hai files handle karne ke liye

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = "./public/temp";
        
        //  Agar Render server par ye folder nahi milega, toh ye line khud naya folder bana degi
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
  
export const upload = multer({ 
    storage, 
});