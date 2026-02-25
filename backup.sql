CREATE TABLE "public"."manufacturers" ( 
  "id" SERIAL,
  "name" TEXT NOT NULL,
  CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "manufacturers_name_key" UNIQUE ("name")
);
CREATE TABLE "public"."order_items" ( 
  "order_id" INTEGER NOT NULL,
  "product_article" TEXT NOT NULL,
  "qty" INTEGER NOT NULL,
  CONSTRAINT "order_items_pkey" PRIMARY KEY ("order_id", "product_article")
);
CREATE TABLE "public"."orders" ( 
  "id" INTEGER NOT NULL,
  "order_date" DATE NOT NULL,
  "delivery_date" DATE NOT NULL,
  "pickup_point_id" INTEGER NOT NULL,
  "user_id" BIGINT NOT NULL,
  "pickup_code" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "orders_pickup_code_key" UNIQUE ("pickup_code")
);
CREATE TABLE "public"."pickup_points" ( 
  "id" INTEGER NOT NULL,
  "postal_code" TEXT NOT NULL,
  "city" TEXT NOT NULL,
  "street" TEXT NOT NULL,
  "house" TEXT NULL,
  CONSTRAINT "pickup_points_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "public"."product_categories" ( 
  "id" SERIAL,
  "name" TEXT NOT NULL,
  CONSTRAINT "product_categories_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "product_categories_name_key" UNIQUE ("name")
);
CREATE TABLE "public"."products" ( 
  "article" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "unit" TEXT NOT NULL,
  "price" NUMERIC NOT NULL,
  "supplier_id" BIGINT NOT NULL,
  "manufacturer_id" BIGINT NOT NULL,
  "category_id" BIGINT NOT NULL,
  "discount_percent" INTEGER NOT NULL DEFAULT 0 ,
  "stock_qty" INTEGER NOT NULL DEFAULT 0 ,
  "description" TEXT NULL,
  "photo" TEXT NULL,
  CONSTRAINT "products_pkey" PRIMARY KEY ("article")
);
CREATE TABLE "public"."roles" ( 
  "id" SERIAL,
  "code" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  CONSTRAINT "roles_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "roles_code_key" UNIQUE ("code")
);
CREATE TABLE "public"."suppliers" ( 
  "id" SERIAL,
  "name" TEXT NOT NULL,
  CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "suppliers_name_key" UNIQUE ("name")
);
CREATE TABLE "public"."users" ( 
  "id" SERIAL,
  "full_name" TEXT NOT NULL,
  "login" TEXT NOT NULL,
  "password_plain" TEXT NOT NULL,
  "role_id" BIGINT NOT NULL,
  CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "users_login_key" UNIQUE ("login")
);
ALTER TABLE "public"."manufacturers" DISABLE TRIGGER ALL;
ALTER TABLE "public"."order_items" DISABLE TRIGGER ALL;
ALTER TABLE "public"."orders" DISABLE TRIGGER ALL;
ALTER TABLE "public"."pickup_points" DISABLE TRIGGER ALL;
ALTER TABLE "public"."product_categories" DISABLE TRIGGER ALL;
ALTER TABLE "public"."products" DISABLE TRIGGER ALL;
ALTER TABLE "public"."roles" DISABLE TRIGGER ALL;
ALTER TABLE "public"."suppliers" DISABLE TRIGGER ALL;
ALTER TABLE "public"."users" DISABLE TRIGGER ALL;
INSERT INTO "public"."manufacturers" ("id", "name") VALUES (1, 'Slash');
INSERT INTO "public"."manufacturers" ("id", "name") VALUES (2, 'Shimano');
INSERT INTO "public"."manufacturers" ("id", "name") VALUES (3, 'Skill bike');
INSERT INTO "public"."manufacturers" ("id", "name") VALUES (4, 'NEXT');
INSERT INTO "public"."manufacturers" ("id", "name") VALUES (5, 'Aero');
INSERT INTO "public"."manufacturers" ("id", "name") VALUES (6, 'Fizard');
INSERT INTO "public"."manufacturers" ("id", "name") VALUES (7, 'kari');
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (1, 'A112T4', 2);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (1, 'G843H5', 2);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (2, 'G843H5', 1);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (2, 'A112T4', 1);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (3, 'D325D4', 10);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (3, 'S432T5', 10);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (4, 'F325D4', 5);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (4, 'D325D4', 4);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (5, 'G432G6', 20);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (5, 'H542F5', 20);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (6, 'A112T4', 2);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (6, 'G843H5', 2);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (7, 'C346F5', 3);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (7, 'F256G6', 3);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (8, 'F325D4', 1);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (8, 'G432G6', 1);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (9, 'J532V5', 5);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (9, 'F256G6', 1);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (10, 'F256G6', 5);
INSERT INTO "public"."order_items" ("order_id", "product_article", "qty") VALUES (10, 'J532V5', 5);
INSERT INTO "public"."orders" ("id", "order_date", "delivery_date", "pickup_point_id", "user_id", "pickup_code", "status") VALUES (1, '2023-02-27', '2023-04-20', 1, 10, '901', 'Новый');
INSERT INTO "public"."orders" ("id", "order_date", "delivery_date", "pickup_point_id", "user_id", "pickup_code", "status") VALUES (2, '2022-09-28', '2023-04-21', 11, 1, '902', 'Новый');
INSERT INTO "public"."orders" ("id", "order_date", "delivery_date", "pickup_point_id", "user_id", "pickup_code", "status") VALUES (3, '2023-03-21', '2023-04-22', 2, 2, '903', 'Новый');
INSERT INTO "public"."orders" ("id", "order_date", "delivery_date", "pickup_point_id", "user_id", "pickup_code", "status") VALUES (4, '2023-02-20', '2023-04-23', 11, 3, '904', 'Завершен');
INSERT INTO "public"."orders" ("id", "order_date", "delivery_date", "pickup_point_id", "user_id", "pickup_code", "status") VALUES (5, '2023-03-17', '2023-04-24', 2, 10, '905', 'Завершен');
INSERT INTO "public"."orders" ("id", "order_date", "delivery_date", "pickup_point_id", "user_id", "pickup_code", "status") VALUES (6, '2023-03-01', '2023-04-25', 15, 1, '906', 'Завершен');
INSERT INTO "public"."orders" ("id", "order_date", "delivery_date", "pickup_point_id", "user_id", "pickup_code", "status") VALUES (7, '2023-02-28', '2023-04-26', 3, 2, '907', 'Завершен');
INSERT INTO "public"."orders" ("id", "order_date", "delivery_date", "pickup_point_id", "user_id", "pickup_code", "status") VALUES (8, '2023-03-31', '2023-04-27', 19, 3, '908', 'Новый');
INSERT INTO "public"."orders" ("id", "order_date", "delivery_date", "pickup_point_id", "user_id", "pickup_code", "status") VALUES (9, '2023-04-02', '2023-04-28', 5, 10, '909', 'Новый');
INSERT INTO "public"."orders" ("id", "order_date", "delivery_date", "pickup_point_id", "user_id", "pickup_code", "status") VALUES (10, '2023-04-03', '2023-04-29', 19, 10, '910', 'Новый');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (1, '420151', 'Лесной', 'Вишневая', '32');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (2, '125061', 'Лесной', 'Подгорная', '8');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (3, '630370', 'Лесной', 'Шоссейная', '24');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (4, '400562', 'Лесной', 'Зеленая', '32');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (5, '614510', 'Лесной', 'Маяковского', '47');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (6, '410542', 'Лесной', 'Светлая', '46');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (7, '620839', 'Лесной', 'Цветочная', '8');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (8, '443890', 'Лесной', 'Коммунистическая', '1');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (9, '603379', 'Лесной', 'Спортивная', '46');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (10, '603721', 'Лесной', 'Гоголя', '41');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (11, '410172', 'Лесной', 'Северная', '13');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (12, '614611', 'Лесной', 'Молодежная', '50');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (13, '454311', 'Лесной', 'Новая', '19');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (14, '660007', 'Лесной', 'Октябрьская', '19');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (15, '603036', 'Лесной', 'Садовая', '4');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (16, '394060', 'Лесной', 'Фрунзе', '43');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (17, '410661', 'Лесной', 'Школьная', '50');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (18, '625590', 'Лесной', 'Коммунистическая', '20');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (19, '625683', 'Лесной', '8 Марта', NULL);
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (20, '450983', 'Лесной', 'Комсомольская', '26');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (21, '394782', 'Лесной', 'Чехова', '3');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (22, '603002', 'Лесной', 'Дзержинского', '28');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (23, '450558', 'Лесной', 'Набережная', '30');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (24, '344288', 'Лесной', 'Чехова', '1');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (25, '614164', 'Лесной', 'Степная', '30');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (26, '394242', 'Лесной', 'Коммунистическая', '43');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (27, '660540', 'Лесной', 'Солнечная', '25');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (28, '125837', 'Лесной', 'Шоссейная', '40');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (29, '125703', 'Лесной', 'Партизанская', '49');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (30, '625283', 'Лесной', 'Победы', '46');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (31, '614753', 'Лесной', 'Полевая', '35');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (32, '426030', 'Лесной', 'Маяковского', '44');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (33, '450375', 'Лесной', 'Клубная', '44');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (34, '625560', 'Лесной', 'Некрасова', '12');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (35, '630201', 'Лесной', 'Комсомольская', '17');
INSERT INTO "public"."pickup_points" ("id", "postal_code", "city", "street", "house") VALUES (36, '190949', 'Лесной', 'Мичурина', '26');
INSERT INTO "public"."product_categories" ("id", "name") VALUES (1, 'Велосипед взрослый горный');
INSERT INTO "public"."product_categories" ("id", "name") VALUES (2, 'Велосипед городской подростковый');
INSERT INTO "public"."product_categories" ("id", "name") VALUES (3, 'Велосипед городской взрослый');
INSERT INTO "public"."product_categories" ("id", "name") VALUES (4, 'Велосипед детский горный');
INSERT INTO "public"."product_categories" ("id", "name") VALUES (5, 'Велосипед детский городской');
INSERT INTO "public"."products" ("article", "name", "unit", "price", "supplier_id", "manufacturer_id", "category_id", "discount_percent", "stock_qty", "description", "photo") VALUES ('A112T4', 'Велосипед взрослый горный Slash Stream 27.5 колеса (2025) 17" Черный (162-172 см)', 'шт.', '19775.00', 1, 1, 1, 30, 15, 'Горный велосипед Slash Stream 27.5 (2025) - легкий и надежный компаньон для поездок по пересеченной местности. Мощные шатуны интенсивно передают усилия мышц на вал каретки.', '1.jpg');
INSERT INTO "public"."products" ("article", "name", "unit", "price", "supplier_id", "manufacturer_id", "category_id", "discount_percent", "stock_qty", "description", "photo") VALUES ('G843H5', 'Велосипед взрослый горный Slash Stream 27.5 колеса (2025) 19" Синий (172-182 см)', 'шт.', '19791.00', 1, 1, 1, 30, 9, 'В комплектацию включены дисковые механические тормоза RPT DSC-310. Особый упор разработчики рамы данной модели сделали на увеличение прочности мест наибольшей нагрузки.', '2.jpg');
INSERT INTO "public"."products" ("article", "name", "unit", "price", "supplier_id", "manufacturer_id", "category_id", "discount_percent", "stock_qty", "description", "photo") VALUES ('D325D4', 'Велосипед городской подростковый серый', 'шт.', '9919.00', 2, 2, 2, 5, 12, 'Городской подростковый велосипед - идеальный выбор для активного образа жизни! Откройте для себя комфорт и свободу передвижения с нашим стильным городским велосипедом.', '3.jpg');
INSERT INTO "public"."products" ("article", "name", "unit", "price", "supplier_id", "manufacturer_id", "category_id", "discount_percent", "stock_qty", "description", "photo") VALUES ('S432T5', 'Велосипед Skill Bike 3051, городской, 21 скорость, сталь, 29" колеса, черно-красный', 'шт.', '16442.00', 3, 3, 3, 15, 15, 'SKILL BIKE модель 3051 - горный велосипед на спицах, обеспечивающий уверенную и комфортную езду как по городским улицам, так и по горной местности.', '4.jpg');
INSERT INTO "public"."products" ("article", "name", "unit", "price", "supplier_id", "manufacturer_id", "category_id", "discount_percent", "stock_qty", "description", "photo") VALUES ('F325D4', 'Велосипед Skillbike 3052, горный, складной, рама 17 дюймов, колеса 26 дюймов, 21 скорость', 'шт.', '17985.00', 3, 3, 1, 18, 50, 'SKILL BIKE модель 3052 - велосипед складной, предназначен для тех, кто ценит комфорт, стиль и максимальную мобильность. Горный велосипед легко помещается в багажник и идеально подходит для активных поездок в городской суете.', '5.jpg');
INSERT INTO "public"."products" ("article", "name", "unit", "price", "supplier_id", "manufacturer_id", "category_id", "discount_percent", "stock_qty", "description", "photo") VALUES ('G432G6', 'Велосипед Skill Bike 3053, горный, двухподвесный, рама 17 дюймов, колеса 26 дюймов, 21 скорость', 'шт.', '17621.00', 3, 3, 1, 20, 0, 'SKILL BIKE модель 3053 - горный велосипед на литых дисках, имеет амортизаторы как на переднем, так и на заднем колесе.', '6.jpg');
INSERT INTO "public"."products" ("article", "name", "unit", "price", "supplier_id", "manufacturer_id", "category_id", "discount_percent", "stock_qty", "description", "photo") VALUES ('H542F5', 'Велосипед MILANO M300, горный, для взрослых, 26", 7 скоростей', 'шт.', '13509.00', 4, 4, 1, 4, 5, 'Горный велосипед MILANO M300 с диаметром колес 26 дюйма подойдет для подростков и взрослых, без усилий позволит преодолевать любые непроходимые каменистые поверхности и зоны бездорожья.', '7.jpg');
INSERT INTO "public"."products" ("article", "name", "unit", "price", "supplier_id", "manufacturer_id", "category_id", "discount_percent", "stock_qty", "description", "photo") VALUES ('C346F5', 'Горный велосипед скоростной, колеса 24", рама - 14", черно-красный', 'шт.', '15212.00', 4, 5, 4, 5, 4, 'Горный велосипед - это надежный и стильный выбор для любителей активного отдыха. Удобное седло из искусственной кожи и наличие подножки добавляют удобства во время поездок.', '8.jpg');
INSERT INTO "public"."products" ("article", "name", "unit", "price", "supplier_id", "manufacturer_id", "category_id", "discount_percent", "stock_qty", "description", "photo") VALUES ('F256G6', '26" Велосипед Fizard, 15" алюминий, дисковые тормоза, 21 скорость, серый', 'шт.', '15126.00', 4, 6, 4, 25, 3, 'Горный велосипед Fizard - надежный универсальный маунтинбайк для города и бездорожья.', '9.jpg');
INSERT INTO "public"."products" ("article", "name", "unit", "price", "supplier_id", "manufacturer_id", "category_id", "discount_percent", "stock_qty", "description", "photo") VALUES ('J532V5', 'Велосипед двухколесный детский 14 дюймов, со светящимися колесами, черный', 'шт.', '6417.00', 5, 7, 5, 8, 6, 'Велосипед двухколесный детский 14 дюймов от Kari - это надежный и безопасный транспорт для вашего ребенка.', NULL);
INSERT INTO "public"."roles" ("id", "code", "name") VALUES (1, 'admin', 'Админ');
INSERT INTO "public"."roles" ("id", "code", "name") VALUES (2, 'manager', 'Менеджер');
INSERT INTO "public"."roles" ("id", "code", "name") VALUES (3, 'client', 'Клиент');
INSERT INTO "public"."suppliers" ("id", "name") VALUES (1, 'ВелоСтрана');
INSERT INTO "public"."suppliers" ("id", "name") VALUES (2, 'ЯндексМаркет');
INSERT INTO "public"."suppliers" ("id", "name") VALUES (3, 'Скилс');
INSERT INTO "public"."suppliers" ("id", "name") VALUES (4, 'ПерспективаГрупп');
INSERT INTO "public"."suppliers" ("id", "name") VALUES (5, 'kari');
INSERT INTO "public"."users" ("id", "full_name", "login", "password_plain", "role_id") VALUES (1, 'Никифорова Весения Николаевна', '94d5ous@gmail.com', 'uzWC67', 1);
INSERT INTO "public"."users" ("id", "full_name", "login", "password_plain", "role_id") VALUES (2, 'Сазонов Руслан Германович', 'uth4iz@mail.com', '2L6KZG', 1);
INSERT INTO "public"."users" ("id", "full_name", "login", "password_plain", "role_id") VALUES (3, 'Одинцов Серафим Артёмович', '5d4zbu@tutanota.com', 'rwVDh9', 1);
INSERT INTO "public"."users" ("id", "full_name", "login", "password_plain", "role_id") VALUES (4, 'Ситдикова Елена Анатольевна', 'ptec8ym@yahoo.com', 'LdNyos', 2);
INSERT INTO "public"."users" ("id", "full_name", "login", "password_plain", "role_id") VALUES (5, 'Ворсин Петр Евгеньевич', '1qz4kw@mail.com', 'gynQMT', 2);
INSERT INTO "public"."users" ("id", "full_name", "login", "password_plain", "role_id") VALUES (6, 'Старикова Елена Павловна', '4np6se@mail.com', 'AtnDjr', 2);
INSERT INTO "public"."users" ("id", "full_name", "login", "password_plain", "role_id") VALUES (7, 'Никифорова Анна Семеновна', 'yzls62@outlook.com', 'JlFRCZ', 3);
INSERT INTO "public"."users" ("id", "full_name", "login", "password_plain", "role_id") VALUES (8, 'Стелина Евгения Петровна', '1diph5e@tutanota.com', '8ntwUp', 3);
INSERT INTO "public"."users" ("id", "full_name", "login", "password_plain", "role_id") VALUES (9, 'Михайлюк Анна Вячеславовна', 'tjde7c@yahoo.com', 'YOyhfR', 3);
INSERT INTO "public"."users" ("id", "full_name", "login", "password_plain", "role_id") VALUES (10, 'Степанов Михаил Артёмович', 'wpmrc3do@tutanota.com', 'RSbvHv', 3);
ALTER TABLE "public"."manufacturers" ENABLE TRIGGER ALL;
ALTER TABLE "public"."order_items" ENABLE TRIGGER ALL;
ALTER TABLE "public"."orders" ENABLE TRIGGER ALL;
ALTER TABLE "public"."pickup_points" ENABLE TRIGGER ALL;
ALTER TABLE "public"."product_categories" ENABLE TRIGGER ALL;
ALTER TABLE "public"."products" ENABLE TRIGGER ALL;
ALTER TABLE "public"."roles" ENABLE TRIGGER ALL;
ALTER TABLE "public"."suppliers" ENABLE TRIGGER ALL;
ALTER TABLE "public"."users" ENABLE TRIGGER ALL;
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_product_article_fkey" FOREIGN KEY ("product_article") REFERENCES "public"."products" ("article");
ALTER TABLE "public"."order_items" ADD CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders" ("id");
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users" ("id");
ALTER TABLE "public"."orders" ADD CONSTRAINT "orders_pickup_point_id_fkey" FOREIGN KEY ("pickup_point_id") REFERENCES "public"."pickup_points" ("id");
ALTER TABLE "public"."products" ADD CONSTRAINT "products_supplier_id_fkey" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers" ("id");
ALTER TABLE "public"."products" ADD CONSTRAINT "products_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "public"."manufacturers" ("id");
ALTER TABLE "public"."products" ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories" ("id");
ALTER TABLE "public"."users" ADD CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "public"."roles" ("id");
