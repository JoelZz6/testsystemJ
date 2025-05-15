const bcrypt = require('bcrypt');

     const generarHash = async () => {
       const contrasena = '123'; // Cambia esto por la contraseña deseada
       const saltRounds = 13;
       const hash = await bcrypt.hash(contrasena, saltRounds);
       console.log('Hash generado:', hash);
     };

     generarHash();