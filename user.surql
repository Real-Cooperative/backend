DEFINE TABLE user SCHEMAFULL
    PERMISSIONS
        FOR select FULL
        FOR update, delete WHERE id = $auth.id
        FOR create NONE;

DEFINE FIELD username ON user TYPE string;
DEFINE FIELD password ON user TYPE string;
DEFINE FIELD settings ON user TYPE option<object>;
DEFINE FIELD settings.marketing ON user TYPE option<bool>;
DEFINE FIELD email ON user TYPE option<string>;
DEFINE FIELD created ON user TYPE datetime VALUE time::now() READONLY;
DEFINE FIELD posts ON TABLE user TYPE option<array>;
DEFINE FIELD salt ON user TYPE string;
DEFINE FIELD subscriptions ON user TYPE option<array>;
DEFINE FIELD subscriptions.* ON user TYPE option<string>;
DEFINE INDEX idx_user ON user COLUMNS user UNIQUE;



DEFINE SCOPE all_users
  SESSION 30d
  SIGNUP ( 
    CREATE user 
      SET 
        username = $username, 
        password = crypto::argon2::generate($password),
        salt = $salt,
        email = $email,
        settings = $settings,
        settings.marketing = $settings.marketing
  )
  SIGNIN ( 
    SELECT * 
    FROM user 
    WHERE username = $username AND 
    crypto::argon2::compare(password, $password) );

INFO FOR DB;