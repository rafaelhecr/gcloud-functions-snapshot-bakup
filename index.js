/**
*Script para ejecutar un snapshot
Este script consta de varios verificadores de seguridad.
Se necesita un Key unico para cada proyecto generado por el usuario.
Solo se aceptan los parametros por GET, otro metodo es descartado
Los parametros se Parsean con el Path /param

los parametros son:
nameproyect /es el nombre del proyecto en google cloud
zoneproyect /la zona en donde el usuario le indico a GCP donde almacene el proyecto
diskproyect /el nombre del disco, de la instancia a la que se le hara el snapshot
guestflushactive /valor boobleano parseado como string, para activar el VSS de Windows Server (recomendado en True)
namebeforedate /nombre que se asigna, anterior a un identificador que es la fecha y hora en el que se crea el snapshot, preferente el nombre del proyecto
**/

/*Funcion  principal de GCP Functions, evaluacion del path*/
exports.snapshot = function snapshot(req,res){
	const path = req.path //evaluacion del path
	switch(path){
		case '/param':
		executeSnapshot(req,res); // se llama a la función executeSnapshot para que se ejecute en esta función principál
		break;
	default:
		res.status(200).send("El servidor sigue escuchando"); //en caso de que el URL no traiga el path /param, no hara llamado a ninguna función.
	}
}; //fin de la ejecución  de la función principal.

/*Función para ejecutar el snapshot*/
const executeSnapshot = (req,res) => {
	if (req.method === 'GET') { //Se verifica que sea por el metodo GET solamente el paso de parametros
		var miKey = ' '; //Aqui debes escribir una cadena propia, que venga en el GET y se compare en este punto
		var theKey = req.query.key;
		if (theKey === miKey) { //Verificacion de la KEY unica, establecida por el usuario
			var nameProyect = req.query.nameproyect;//nombre del proyecto
			var zoneProyect = req.query.zoneproyect;//zona del proyecto
			var diskProyect = req.query.diskproyect;//disco del proyecto
			var guestFlushActive = req.query.guestflushactive; //activiacion del VSS --True
			var nameBeforeDate = req.query.namebeforedate;//nombre identificador dado al proyecto
			nameBeforeDate = nameBeforeDate.toLowerCase();
			/*Funcion para crear el nombre*/
			//generador de la fecha
			var dateToday = new Date();

			function noZeroInTheDate(digit){
				var myDigit;
				if (digit<10) {
					myDigit = "0" + digit.toString();
				} else {
					myDigit = digit.toString();
				}
				return myDigit;
			}

			var dayToday = noZeroInTheDate(dateToday.getDate());
			var monthToday = noZeroInTheDate(dateToday.getMonth()+1);
			var yearToday = noZeroInTheDate(dateToday.getFullYear());
			var hourToday = noZeroInTheDate(dateToday.getUTCHours()-6);
			var minutesToday = noZeroInTheDate(dateToday.getMinutes());

			//generador del nombre que se le asignara al snapshot
			var nameSnapshot = nameBeforeDate + dayToday + monthToday + yearToday + hourToday + minutesToday;

			/*Funcion para crear el Spashot*/
			//importación de librerias requeridas
			var google = require('googleapis');
			var compute = google.compute('beta');


			//llamado a la función con los parametros obtendios del URL
			authorize(function(authClient){
				var request = {
					project: nameProyect,
					zone: zoneProyect,
					disk: diskProyect,
					guestFlush: guestFlushActive,
					resource: {
						name: nameSnapshot,
					},
					auth: authClient,
				};

				//Ejecunción para crear el snapshot
				compute.disks.createSnapshot(request, function(err, response){
					if (err){
						console.error(err);
						return;
					}
					console.log(JSON.stringify(response, null, 2));
				});
			});

			//función que valida la autentificación de las crecenciales de google
			//usar Google Auth 2.0
			function authorize(callback) {
	      		google.auth.getApplicationDefault(function(err, authClient) {
	        		if (err) {
	          			console.error('authentication failed: ', err);
	          			return;
	        		}
	        		if (authClient.createScopedRequired && authClient.createScopedRequired()) {
	          			var scopes = ['https://www.googleapis.com/auth/cloud-platform'];
	          			authClient = authClient.createScoped(scopes);
	        		}
	        		callback(authClient);
	      		});
	      	}

	      	sendEmail();
			res.status(200).send('Trabajo completado con exito.');
		}//fin del if que verifico la paridad con los keys
	} else { //fin del if que valido si se recibio la solicitud por GET, en caso de que sea por otro metodo mandara error.
		res.status(404);
	}
}//fin de execute snapshot.

/*Funciòn para enviar un enviar un correo de notificación*/
const sendEmail = () => {
	const sgMail = require('@sendgrid/mail');  //llamar a las librerias de SendGrid en Packajes.JSON
	sgMail.setApiKey('');
	const msg = { //cuerpo del correo
		to: '',
		from: '',
		subject: '', //contenido del correo
		text: '',
		html: '',
	};//fin del JSON con los parametros que contendra el correo electronico
	sgMail.send(msg);//enviar el correo
}//fin de la función de envio de correo
