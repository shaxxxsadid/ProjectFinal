
Мб новости по желанию // для диплома 
Сделать адаптивную верстку // для диплома Пока не надо !!
В каталоге проверить уровни категорий фильтр не фильтрует на уровне категорий как надо надо указывать у продукта все категории по которым будет производиться фильтрация
Письмо обратной связи для контакта
Статус подговки заказа самовывоза Стадии "Заказ принят" "Собираеться заказ" "Ожидает того что заберут со склада транспортировочная компания"
Отправка письма о готовности заказа
Регистрация
Для пользователя добавить понятные информационные страницы и переделать главную с кратим описанием страницы + кнопка подробнее отдельным блоком
Заказы сделаны но нужно добавить отображение на каких складах они есть(optional)
------ Важное -----

Сделать Полное переосмысление модели Product

модель Product  
// app/models/Products.ts (улучшенная модель)
import { Schema, model, models } from 'mongoose';

const productSchema = new Schema({
    // Базовые поля
    sku: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    price: { type: Number, required: true },

    attributes: {
        dimensions: [
            { name: 'length', value: { type: Number } },
            { name: 'width', value: { type: Number } },
            { name: 'height', value: { type: Number } },
            { name: 'weight', value: { type: Number } },
        ],
        packaging: {
            unit: { type: String, enum: ['шт', 'кг', 'м', 'паллет'] },
            quantityPerUnit: { type: Number },
        },
        storageConditions: [
            { 
                temperatureMin: { type: Number }, 
                temperatureMax: { type: Number },
                humidityMax: { type: Number }
            }
        ],
        certifications: [
            { name: 'IPPC', value: Boolean, required: false },
            { name: 'ISO9001', value: Boolean, required: false },
            { name: 'CE', value: Boolean, required: false },
        ]
    },
    
    logistics: {
        loadCapacity: { type: Number },     // Грузоподъемность единицы
        volumeM3: { type: Number },         // Объем в м³
        palletQuantity: { type: Number },   // Кол-во на паллете
        storageType: { 
            type: String, 
            enum: ['сыпучие', 'навал', 'настольные', 'контейнеры']
        }
    },

    // ✅ Отраслевые проверки (автоматизация)
    isHeatTreated: { type: Boolean },      // Термическая обработка
    isIPPC_Certified: { type: Boolean },   // Сертификация IPPC
    expiryDate: { type: Date, required: false },  // Срок годности

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const Products = models['Products'] || model('Products', productSchema, 'Products');

// ✅ Индексы для оптимизации отраслевых запросов
productSchema.index({ sku: 1 });
productSchema.index({ categoryId: 1 });
productSchema.index({ 'attributes.certifications.IPPC': 1 });
productSchema.index({ 'logistics.storageType': 1 });






