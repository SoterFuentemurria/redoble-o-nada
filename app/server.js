//// DEBUG
///// SI UN CAPITAN O UN JUEZ SE DESCONECTAN, COMO LA ASIGNACION VA POR ORDEN DE ENTRADA
///// AL RECONECTAR ENTRAN COMO COMBATIENTES



// Se importan los modulos
const express = require('express')
const app = express()
const path = require('path')
const { createServer } = require("http");
const { Server } = require("socket.io");
const { on } = require('events');
const PORT = process.env.PORT || 5000
var throttle = require("lodash/throttle");

// ruta para servir la build de producción
app.use(express.static(path.join(__dirname, '../build')))

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
});

// Inicialización del servidor
const httpServer = createServer(app);
const io = new Server(httpServer, {
    perMessageDeflate: false,
    
    cors: {
        origin: "http://www.redobleonada.com/",
        //origin: "*",
    },
});

// Variables globales
let juegoIniciado = false 
let ronda = 0
let equipoOrden = []
let equipoCaos = []
let equipoImparcial = []
let idHost = ""
let usuarios = {}
let idCapCaos = ""
let idCapOrden = ""
let idJuez = []
let hayCapCaos = false
let hayCapOrden = false
let hayJuez = false

// helperfunction
function getKeyByValue(object, value) {
  return Object.keys(object).find(key => object[key] === value);
}

// Cuando se conecta un jugador 
io.on("connection", (socket) => {
  //variables que se establecen en conexión
  let userName = ""
  //broadcast del numero de usuarios y aviso a la consola
  io.sockets.emit("usuarios", io.engine.clientsCount - 1);
  console.log("a user has connected")
  console.log(io.engine.clientsCount - 1)

 
// Cuando se desconecta un cliente
  socket.on("disconnect", ()=> {
    //avisa de la desconexión a la consola del server
    console.log("a user has disconnected")
    //updatea el display de numero de usuarios conectados
    io.sockets.emit("usuarios", io.engine.clientsCount - 1);
    // Si se queda vacante la plaza de Juez, o Capitan, avisamos al programa
    if (socket.id == idCapCaos) {
      hayCapCaos = false
    }

    if (socket.id == idCapOrden) {
      hayCapOrden = false
    }

    for (let i = 0; i<idJuez.length; i++){
      if (socket.id == idJuez[i]) {
        hayJuez = false
        break
      }
    }
    //retirar la socket del equipo correspondiente
    // se obtiene el usuario de un diccionario a partir de la socket
    userName = usuarios[socket.id]
    // con el usuario se obtiene el indice del array equipo
    indexCaos = equipoCaos.indexOf(userName)
    indexOrden = equipoOrden.indexOf(userName)
    delete usuarios[socket.id]
    // si se ha encontrado indice se elimina la entrada del array
    console.log(usuarios)
    console.log(userName)
    console.log(indexOrden)
    console.log(indexCaos)
    if (indexCaos > -1) { 
      equipoCaos.splice(indexCaos, 1) 
    }

    if (indexOrden > -1) { 
      equipoOrden.splice(indexOrden, 1) 
    }

    // se updatean los equipos
    io.to(idHost).emit("equipoOrden", equipoOrden)
    io.to(idHost).emit("equipoCaos", equipoCaos)
  })

// Cuando el cliente introduce su usuario
  socket.on("username", (arg, callback)=> {
    userName = arg.userName + " "
     // Asignación de clase, por hacer
    let clase = ""
    // En el caso de que el cliente sea el host, asignamos su clase y guardamos su id
    if (userName == "host ") {
      clase = "host"
      idHost = socket.id
    } 
    // Para el resto de clientes
    else {
        // guardamos su usuario en el diccionario en función de su id
        usuarios[socket.id] = userName
      // Asignación de equipo
         let equipo = ""

        // asignación de entidades imparciales
        if ((io.engine.clientsCount - 1) == 1 || (io.engine.clientsCount - 1) == 11 || (io.engine.clientsCount - 1) == 21 || (io.engine.clientsCount - 1) == 31 || hayJuez == false ) {
          equipo = "imparcial"
          equipoImparcial.push(userName)
          hayJuez = true
          io.to(idHost).emit("equipoImparcial", equipoImparcial)
          console.log("EQUIPO", equipo)
        }
        else {
           // si entra en par se va a equipo orden
         if ((io.engine.clientsCount - 1) % 2 == 0) {
          equipo = "orden"
          equipoOrden.push(userName)
          let reserva = [...equipoOrden]
          if (reserva.indexOf(usuarios[idCapOrden]) > -1) {
            reserva.splice(reserva.indexOf(usuarios[idCapOrden]), 1)
          }
          io.to(idHost).emit("equipoOrden", equipoOrden)
          io.to(idCapOrden).emit("reservas", reserva)
        } 
        // de lo contrario se va a caos
        else {
          equipo = "caos"
          equipoCaos.push(userName)
          let reserva = [...equipoCaos]
          if (reserva.indexOf(usuarios[idCapCaos]) > -1) {
            reserva.splice(reserva.indexOf(usuarios[idCapCaos]), 1)
          }
          io.to(idHost).emit("equipoCaos", equipoCaos)
          io.to(idCapCaos).emit("reservas", reserva)
        }
        }
        
        // enviamos la info de equipo al cliente
         socket.emit("equipo", equipo)
         callback(userName)

        // normas para la asignación de clase en función del equipo
         if (equipo == "imparcial") {
          console.log("EQUIPO", equipo)
          clase = "Juez"
          idJuez.push(socket.id)
          console.log("clase1", clase)
         }
         
         if (equipo == "caos") {
          if (usuarios[socket.id] == equipoCaos[0] || hayCapCaos == false) {
            clase = "Capitan"
            idCapCaos = socket.id
            hayCapCaos = true
          } else {
            clase = "Soldado"
          }
         } 
         if (equipo == "orden") {
          if (usuarios[socket.id] == equipoOrden[0] || hayCapOrden == false) {
            clase = "Capitan"
            idCapOrden = socket.id
            hayCapOrden = true
          } else {
            clase = "Soldado"
            }
          }
        
        
    }
    // enviamos la clase al cliente
    console.log("clase2", clase)
    socket.emit("clase", clase)
  })

  // Cuando el host inicia el juego
    socket.on("iniciar", ()=> {
      juegoIniciado = true
      ronda = 1
      io.emit("iniciando", juegoIniciado)
    })

    // cuando un cliente pregunta si el juego esta iniciado
    socket.on("iniciado?", ()=> {socket.emit("iniciando", juegoIniciado)})

    // cuando el host entra
    socket.on("hostActivo", ()=> {
      io.to(idHost).emit("equipoOrden", equipoOrden)
      io.to(idHost).emit("equipoCaos", equipoCaos)
    })
    // cuando un Cap pregunta su equipo
    socket.on("CapEquipo?",(userName, callback)=>{
      let equipo = ""
      if (socket.id === idCapCaos) {equipo = "caos"} else {
      if (socket.id === idCapOrden) {equipo = "orden"}
      else {
        let id = getKeyByValue(usuarios, userName)
        for (let i=0; i<equipoCaos.length; i++) {
          if (userName == equipoCaos[i]){
            idCapCaos = id
            equipo = "caos"
            break
          } 
          if (userName == equipoOrden[i]){
            idCapOrden = id
            equipo = "orden"
            break
          }
        }
      }}
      callback({status : equipo})
      io.to(socket.id).emit("CapEquipo", equipo )
    })

    socket.on("reservas?", (arg) => {
      console.log("miequipoReservas", arg)
      let reserva
      if (arg == "caos") {
        let capCaos = equipoCaos.indexOf(usuarios[socket.id])
        reserva = [...equipoCaos]
        if (capCaos > -1 ) {
          reserva.splice(capCaos, 1)}
        io.to(socket.id).emit("reservas", reserva)
      } else {
        let capOrden = equipoOrden.indexOf(usuarios[socket.id])
        reserva = [...equipoOrden]
        if (capOrden > -1) { 
          reserva.splice(capOrden, 1)}
        io.to(socket.id).emit("reservas", reserva)
      }
      
    })
    // Cuando recibimos movimientos de voces 
    // Enviamos la info al jugador afectado
    // En función del equipo mandamos la info al cap del equipo contrario
    socket.on("vozmas", (jugador, voz, jugavoz, equipo)=>{
      console.log("vozmas", jugador, voz, jugavoz, equipo)
      let id = getKeyByValue(usuarios, jugador)
      console.log("id", id)
      throttle(io.to(id).emit("vozArm", voz), 100)
      if (equipo === "caos") {
        socket.to(idCapOrden).emit("enemigos", voz, jugavoz)
      } 
      if (equipo === "orden") {
        socket.to(idCapCaos).emit("enemigos", voz, jugavoz)
      }
    })
    socket.on("vozmenos", (jugador, voz, jugavoz, equipo)=>{
      console.log("vozcambio", jugador, voz, jugavoz, equipo)
      let id = getKeyByValue(usuarios, jugador)
      throttle(io.to(id).emit("vozArm", 0),100)
      if (equipo === "caos") {
        socket.to(idCapOrden).emit("enemigos", voz, jugavoz)
      } 
      if (equipo === "orden") {
        socket.to(idCapCaos).emit("enemigos", voz, jugavoz)
      }
    })

    socket.on("propuestaNota", (voz, nota)=> {
      let usuario = userName
      let equipo
      let indexCaos = equipoCaos.indexOf(userName)
      let indexOrden = equipoOrden.indexOf(userName)
   
    if (indexCaos > -1) { 
      equipo = "caos"
    }

    if (indexOrden > -1) { 
      equipo = "orden"
    }
      io.to(idHost).emit("pNota", voz, nota, usuario, equipo)
      
    })

    socket.on("cambiarNota", (voz, nota)=>{
      io.emit("cambioNota", voz, nota)
    })
    
    socket.on("voto", (equipo)=> {
      io.to(idHost).emit("punto", equipo)
    })

    socket.on("puntos", ()=>{
      let puntos = equipoImparcial.length * 10

      io.to(idHost).emit("puntosGanar", puntos)
    })
    socket.on("fin", (equipo)=>
    io.emit("terminado", equipo))
});




httpServer.listen(PORT);

