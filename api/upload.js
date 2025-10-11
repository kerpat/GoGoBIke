const { createClient } = require('@supabase/supabase-js');
const Busboy = require('busboy');
const path = require('path');
const os = require('os');
const fs = require('fs');

function createSupabaseAdmin() {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        throw new Error('Supabase service credentials are not configured.');
    }
    return createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function parseMultipartForm(req) {
    return new Promise((resolve, reject) => {
        const busboy = Busboy({ headers: req.headers });
        const fields = {};
        const files = [];

        busboy.on('file', (fieldname, file, info) => {
            const { filename, encoding, mimeType } = info;
            const safeName = filename || `upload-${Date.now()}`;
            const filepath = path.join(os.tmpdir(), safeName);
            const writeStream = fs.createWriteStream(filepath);
            file.pipe(writeStream);

            file.on('end', () => {
                files.push({
                    fieldname,
                    filename: safeName,
                    encoding,
                    mimetype: mimeType,
                    filepath
                });
            });

            file.on('error', reject);
        });

        busboy.on('field', (fieldname, value) => {
            fields[fieldname] = value;
        });

        let resolved = false;
        const finalize = () => {
            if (resolved) return;
            resolved = true;
            resolve({ fields, files });
        };
        busboy.on('close', finalize);
        busboy.on('finish', finalize);
        busboy.on('error', reject);
        req.on('error', reject);

        req.pipe(busboy);
    });
}

// Обработка загрузки вложений в чат поддержки
async function handleSupportAttachment({ fields, file }) {
    const { anonymousChatId, clientId } = fields;

    if (!anonymousChatId && !clientId) {
        return { status: 400, body: { error: 'anonymousChatId or clientId is required.' } };
    }

    const supabaseAdmin = createSupabaseAdmin();
    const bucketName = 'support_attachments';
    const destinationPath = `${clientId || anonymousChatId}/${Date.now()}-${file.filename}`;
    const fileBuffer = fs.readFileSync(file.filepath);

    const { data, error } = await supabaseAdmin.storage
        .from(bucketName)
        .upload(destinationPath, fileBuffer, {
            contentType: file.mimetype,
            upsert: false
        });

    if (error) {
        throw new Error('Failed to upload file to storage: ' + error.message);
    }

    const { publicUrl } = supabaseAdmin.storage
        .from(bucketName)
        .getPublicUrl(data.path).data;

    return {
        status: 200,
        body: {
            message: 'File uploaded successfully.',
            publicUrl,
            fileType: file.mimetype
        }
    };
}

// Обработка загрузки фото фотоконтроля
async function handleInspectionPhoto({ fields, file }) {
    const { userId, rentalId, photoType } = fields;

    if (!userId || !rentalId || !photoType) {
        return { status: 400, body: { error: 'Missing required parameters: userId, rentalId, photoType' } };
    }

    const supabaseAdmin = createSupabaseAdmin();

    // Проверяем, что аренда принадлежит пользователю
    const { data: rental, error: rentalError } = await supabaseAdmin
        .from('rentals')
        .select('id, user_id, status, pre_rental_photos')
        .eq('id', rentalId)
        .eq('user_id', userId)
        .single();

    if (rentalError || !rental) {
        return { status: 404, body: { error: 'Rental not found' } };
    }

    // Проверяем статус аренды
    if (rental.status !== 'awaiting_contract_signing') {
        return { status: 400, body: { error: 'Rental is not in awaiting_contract_signing status' } };
    }

    // Определяем расширение файла
    const ext = file.mimetype === 'video/mp4' ? 'mp4' : 
                file.mimetype === 'video/webm' ? 'webm' : 
                file.mimetype === 'image/png' ? 'png' : 
                file.mimetype === 'image/webp' ? 'webp' : 'jpg';

    // Путь для сохранения
    const filePath = `${rentalId}/${photoType}.${ext}`;
    const fileBuffer = fs.readFileSync(file.filepath);

    // Загружаем файл в Supabase Storage
    const { error: uploadError } = await supabaseAdmin.storage
        .from('rental-inspections')
        .upload(filePath, fileBuffer, {
            contentType: file.mimetype,
            upsert: true
        });

    if (uploadError) {
        throw new Error('Failed to upload file: ' + uploadError.message);
    }

    // Получаем подписанный URL
    const { data: urlData } = await supabaseAdmin.storage
        .from('rental-inspections')
        .createSignedUrl(filePath, 60 * 60 * 24 * 365); // 1 год

    const fileUrl = urlData?.signedUrl;

    if (!fileUrl) {
        throw new Error('Failed to generate file URL');
    }

    // Обновляем поле pre_rental_photos
    const updatedPhotos = {
        ...(rental.pre_rental_photos || {}),
        [photoType]: fileUrl
    };

    // Проверяем, все ли файлы загружены
    const requiredTypes = ['photo_front', 'photo_back', 'photo_left', 'photo_right', 'video_inspection'];
    const allUploaded = requiredTypes.every(type => updatedPhotos[type]);

    if (allUploaded && !updatedPhotos.completed_at) {
        updatedPhotos.completed_at = new Date().toISOString();
    }

    const { error: updateError } = await supabaseAdmin
        .from('rentals')
        .update({ pre_rental_photos: updatedPhotos })
        .eq('id', rentalId);

    if (updateError) {
        throw new Error('Failed to update rental: ' + updateError.message);
    }

    return {
        status: 200,
        body: {
            message: 'File uploaded successfully',
            url: fileUrl,
            photoType: photoType,
            allCompleted: allUploaded
        }
    };
}

async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        res.status(405).json({ error: 'Method Not Allowed' });
        return;
    }

    try {
        const { fields, files } = await parseMultipartForm(req);

        if (!files || !files.length) {
            res.status(400).json({ error: 'No file uploaded.' });
            return;
        }

        const file = files[0];
        const uploadType = fields.uploadType || 'support'; // 'support' или 'inspection'

        let result;
        
        if (uploadType === 'inspection') {
            result = await handleInspectionPhoto({ fields, file });
        } else {
            result = await handleSupportAttachment({ fields, file });
        }

        // Удаляем временный файл
        fs.unlink(file.filepath, unlinkErr => {
            if (unlinkErr) {
                console.warn('Failed to remove temporary upload:', unlinkErr.message);
            }
        });

        res.status(result.status).json(result.body);
    } catch (error) {
        console.error('Upload handler error:', error);
        res.status(500).json({ error: error.message });
    }
}

module.exports = handler;
module.exports.default = handler;
module.exports.config = { api: { bodyParser: false } };


