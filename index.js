const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express().use(bodyParser.json());

//Va a obtener mis variables
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN;

/*Se activa cuando FB trate de autenticar o mandar 
una solicitud a nuestro hosting o a nuestra aplicación 
para que nosotros tomemos acción de la información que 
ha sido proporcianada por el usuario*/
app.post('/webhook', (req, res) => {
    console.log('POST: webhook');

    const body = req.body;

    /*FB nos va a mandar si la solicitud viene a través 
    de una página, en este caso es correcto*/
    if(body.object === 'page')
    {   
        //lo que mande FB lo tenemos q iterar
        body.entry.forEach(entry => {
            //aquí se reciben los mensajes
            const webhookEvent = entry.messaging[0];
            console.log(webhookEvent);

            //Es el id del mensaje q nos está llegando
            const sender_psid = webhookEvent.sender.id;
            //Quien es el q manda el mensaje
            console.log(`Sender PSID: ${sender_psid}`);

            //validar q recibimos un mensaje
            if(webhookEvent.message)
            {
                handleMessage(sender_psid, webhookEvent.message);
            }else if(webhookEvent.postback){
                handlePostback(sender_psid, webhookEvent.postback);
            }
        });

        res.sendStatus(200).send('EVENTO RECIBIDO');
    }else{
        res.sendStatus(404);
    }
});

/*Se activa cuando FB trate de autenticar o 
mandar una solicitud a nuestro hosting o a nuestra aplicación*/
app.get('/webhook', (req, res) => {
    console.log('GET: webhook');

    const VERIFY_TOKEN = 'stringUnicoParaTuAplicacion';

    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if(mode && token)
    {
        /*El modo con el que manda la solicitud FB sea de suscribe
        y que el token que nosotros configuraremos sea igual*/
        if(mode === 'subscribe' && token === VERIFY_TOKEN)
        {
            console.log('WEBHOOK VERIFICADO');
            res.status(200).send(challenge);
        }else{
            res.sendStatus(404);
        }
    }
});

app.get('/',(req, res) => {
    res.status(200).send(`<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bot</title>
        <style>
            body{
                font-family: Arial, Helvetica, sans-serif;
            }
        </style>
    </head>
    <body>
        <h1>Bot de Vida MRR</h1>
        <h3>Este es la página principal de mi bot, sigue el tutorial para poder construir el tuyo!</h3>
    </body>
    </html>`);
});

//Administración de los eventos
function handleMessage(sender_psid, received_message)
{
    let response;

    if(received_message.text)
    {
        response = {
            'text': `Tu mensaje fue: ${received_message.text} :) Ahora mándame una imagen...`
        }
        //El texto que envió el usuario tiene contenido multimedia
    }else if(received_message.attachments){
        const url = received_message.attachments[0].payload.url;
        response = {
            "attachment":{
                "type":"template",
                "payload":{
                  "template_type":"generic",
                  "elements":[
                     {
                      "title":"Confirma tu imagen",
                      "image_url": url,
                      "subtitle":"Este es un ejemplo de prueba",                      
                      "buttons":[
                        {
                          "type":"postback",
                          "title":"Sí",
                          "payload":"yes"
                        },{
                          "type":"postback",
                          "title":"No",
                          "payload":"no"
                        }              
                      ]      
                    }
                  ]
                }
            }
        }
    }
    callSendApi(sender_psid, response);
}

//Funcionalidad del postback
function handlePostback(sender_psid, received_postback)
{
    let response = '';
    const payload = received_postback.payload;
    if(payload === 'yes')
    {
        response = {'text': 'Muchas gracias por la foto :)'}
    }else if(payload === 'no'){
        //windows + .
        response = {'text': 'No te preocupes manda otra foto 👍'}
    }

    callSendApi(sender_psid, response);
}

//Enviar los mensajes de regreso con la estructura de messenger
function callSendApi(sender_psid, response)
{
    const requestBody = {
        'recipient': {
            'id': sender_psid
        },
        'message': response
    }
    request({
        'uri': 'https://graph.facebook.com/v2.6/me/messages',
        'qs': {'access_token': PAGE_ACCESS_TOKEN},
        'method': 'POST',
        'json': requestBody
    }, (err, res, body) => {
        if(!err)
        {
            console.log('Mensaje enviado de vuelta');
        }else{
            console.error('Imposible enviar mensaje :(');
        }
    });
}

//app.listen((process.env.PORT || 3000));

app.listen((process.env.PORT || 3000), () => {
    console.log('Servidor iniciado ...');
});