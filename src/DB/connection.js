import mongoose from 'mongoose';

const DBConnection = async () => {
    return await mongoose.connect(process.env.DB_URI).then(res => {
        console.log(`DB has Connected Successfully !`);
    }).catch(err => console.error(`Failed to CONNECT to DB !`, err)
    )
}
export default DBConnection;