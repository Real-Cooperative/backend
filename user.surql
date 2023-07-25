DEFINE TABLE user SCHEMAFULL
  PERMISSIONS 
    FOR select, update WHERE id = $auth.id OR created_by = $auth.id, 
    FOR create, WHERE created_by = $auth.id,
    FOR delete, WHERE id = $auth.id;
DEFINE FIELD user ON user TYPE string;
DEFINE FIELD pass ON user TYPE string;
DEFINE FIELD settings ON user TYPE object;
DEFINE FIELD settings.marketing ON user TYPE bool;
DEFINE FIELD email ON user TYPE string;
DEFINE FIELD created ON TABLE user TYPE datetime;
DEFINE FIELD posts ON TABLE user TYPE array;
DEFINE FIELD salt ON user TYPE string;
DEFINE FIELD subscriptions ON user TYPE array;
DEFINE FIELD subscriptions.* ON user TYPE string;
DEFINE INDEX idx_user ON user COLUMNS user UNIQUE;



DEFINE SCOPE allusers
  SESSION 14d
  SIGNUP ( 
    CREATE user 
      SET settings = $settings, 
      settings.marketing = $settings.marketing, 
      user = $user, 
      pass = crypto::argon2::generate($pass), 
      salt = $salt, 
      email = $email, 
      created = $created  
  )
  SIGNIN ( SELECT * FROM user WHERE user = $user AND crypto::argon2::compare(pass, $pass) )