create table users (
	id serial primary key,
	name Text not null,
	email text unique not null,
	created_at timestamp default NOW()
)

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INT NOT NULL,
  amount INT NOT NULL,
  status TEXT DEFAULT 'CREATED'
);

CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  order_id INT NOT NULL,
  amount INT NOT NULL,
  status TEXT DEFAULT 'PENDING'
);


CREATE TABLE inventory (
  id SERIAL PRIMARY KEY,
  product_name TEXT NOT NULL,
  quantity INT NOT NULL
);
