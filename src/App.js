
// To DO

// Limpiar ódigo!!!!!
// Arreglar el bug que vacía las voces
// Diseño
// Buil de producción para probar con los alumnos




// Importamos los modulos
import React from 'react'
import { useEffect } from 'react';
import { io } from "socket.io-client";
import "./App.css"
import * as Tone from 'tone'

import icon from './images/favicon.ico';



// Inicializamos el socket
const URL = "http://www.redobleonada.com/";
//const URL = "http://localhost:5000/";
const socket = io(URL, { autoConnect: false });

// el socket, para cada evento, postea en la consola el evento y los argumentos
socket.onAny((event, ...args) => {
  console.log(event, args);
});



// variables globales
let userNameAlreadyPicked = false
let userName = ''
let numeroUsuarios = 0
let equipo = ""
let clase = ""
let juegoIniciado = false
let ronda = 0
let audioContext = false

let estructura = []

// Componente de React, contiene la lógica de Logeo y conexión
class LoginControl extends React.Component {
  constructor(props) {
    super(props);
    this.state = {value: '', numUsuarios: 0, equipo: "", clase: ""};
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }
  // handleadores de eventos, actualizan el estado al escribir en el formulario y al enviarlo
  handleChange(event) {    this.setState({value: event.target.value});  }
  handleSubmit(event) {
    // se guarda el estado (el valor viene dado por handleChange) en una variable
    userName = this.state.value
    // se actualiza el estado y se cambia el valor de usuario elegido
    this.setState({value: userName})
    userNameAlreadyPicked = true
    event.preventDefault();
    // se envía el evento username, para que el servidor almacene el nombre de usuario
    // se pregunta al servidor si el juego ha empezado
    socket.auth = { userName };
    socket.connect();
    socket.emit("username", socket.auth, (response) => {console.log(response)})
    socket.emit("iniciado?")
  }

  render() {
    // si el usuario no ha elegido nombre, se renderiza el formulario
    if (userNameAlreadyPicked === false) {
    return (
      <div id= "divLogin">
        <div id= "divTitulo"><h1 id="tituloJuego">Redoble o Nada</h1></div>
          
      <div id="flexForm">
      
      <form  id= "formUsuario" onSubmit={this.handleSubmit}>        <label id="etiquetaForm">
          Elige tu Usuario
          <input id="cajaTexto" type="text" value={this.state.value} onChange={this.handleChange} />        </label>
        <input id="botonForm"type="submit" value="Listo!" />
      </form>
      </div>
      </div>
    );}
    else {
      // Si se ha elegido usuario, se activan respuestas de socket para los eventos de ¿Cuantos usuarios?
      // Clase y equipo. Se renderiza el componente del lobby para jugadores o host
      socket.on("usuarios", (arg)=> { numeroUsuarios = arg ;
        this.setState({numUsuarios: numeroUsuarios})
        console.log(numeroUsuarios)})

      socket.on("clase", (arg) => { clase = arg;
        this.setState({clase: clase})
      })
      socket.on("equipo", (arg)=> { equipo = arg;
        this.setState({equipo: equipo})
      })
      
      if (clase === "host") {
        return (<HostLobby/>)
        }  else {
          return (<JugadoresLobby/>)
        }
      }

  
  }
}


// Componente de React para el lobby 
class JugadoresLobby extends React.Component{
  
  // renderiza un mensaje con información para los jugadores
  // seria positivo meter info sobre como se juega y la función del equipo/clase
  render() {
    return(
      <div>
        <h1>Bienvenido a la sala de espera {userName} </h1>
        <p> Jugarás de {clase} en el equipo {equipo}</p>
        <p>Hay {numeroUsuarios} jugadores esperando</p>
        </div>)

    }
  }

// Componente de React para el Lobby
class HostLobby extends React.Component {
  constructor(props){
    super(props)
    this.state = {juegoIniciado: false, equipoCaos: [], equipoOrden: [], cuentaActivada: false, cuenta: 10}
    this.handleClick = this.handleClick.bind(this);
    this.tick = this.tick.bind(this)
  }

  // Evento de clickar en el botón. Inicia el juego en el server
  handleClick(event) {
    this.setState({cuentaActivada:true})
    this.timerID = setInterval(()=> this.tick(), 1000)
    event.preventDefault()
  }

 
  tick(){
    let nextTick = this.state.cuenta - 1
    this.setState({cuenta: nextTick})
    if (this.state.cuenta % 2 === 0) {
      this.displaycuenta = <h1 id = "cuentaAtras">{this.state.cuenta}</h1>
    } else {
      this.displaycuenta = <h1 id = "cuentaAtras2">{this.state.cuenta}</h1>
    }
    
    if (this.state.cuenta === 1){
      socket.emit("iniciar")
      if (audioContext === false) {
        console.log("contextoAudio")
        new Tone.Context()
        
        audioContext = true
      }
    }
  }
  componentWillUnmount() {
    clearInterval(this.timerID)
  }
  


  render() {
    // evento equipo orden, actualiza el estado del componente. Array jugadores equipo Orden
    socket.on("equipoOrden", (arg)=> {
      this.setState({equipoOrden : arg})
    })
    // Lo mismo en equipo Caos
    socket.on("equipoCaos", (arg)=> {
      this.setState({equipoCaos : arg})
    })
    // El host avisa de que esta activo, el server le manda la info para displayear, sirve por si
    // se desconecta. Entra, recupera la info del server, la muestra y como si nada.
    socket.emit("hostActivo")

    const listaOrden = []
    const listaCaos = []
    this.state.equipoCaos.forEach((element) => {listaCaos.push(<p class= "pcaos" >{element}</p>)})
    this.state.equipoOrden.forEach((element) => {listaOrden.push(<p class= "porden">{element}</p>)})

    if (this.state.cuentaActivada === false) {
    return(
      <div>
        <h1>El juego comenzará en breve</h1>
        <div id = "displayEquipos">

          <div id = "displayOrden">
            <h2 id= "h2display">Equipo Orden</h2>
            <div id= "listaOrden">{listaOrden}</div>
          </div>
          <div id = "espacio"><button id = "espacioInicio" onClick={this.handleClick}>Iniciar</button></div>
          <div id = "displayCaos">
            <h2 id = "h2display">Equipo Caos</h2>
            <div id= "listaCaos">{listaCaos}</div>
          </div>

          

        </div>
        
        
      </div>
    )} else {
      return (
        <div>
          <h1>El juego comenzará en breve</h1>
          <div id = "displayEquipos">
  
            <div id = "displayOrden">
              <h2 id= "h2display">Equipo Orden</h2>
              <div id= "listaOrden">{listaOrden}</div>
            </div>
            <div id = "espacio">{this.displaycuenta}</div>
            <div id = "displayCaos">
              <h2 id = "h2display">Equipo Caos</h2>
              <div id= "listaCaos">{listaCaos}</div>
            </div>
  
            
  
          </div>
          
          
        </div>)
    }
  }
}



//class Juez extends React.Component{}

//class Soldado extends React.Component{}

//class Host extends React.Component{}

class Capitan extends React.Component{
  constructor(props){
    super(props)
    this.state = { miEquipo: "" , ronda: 0, reserva: [] , voz1:[] , voz2:[] , voz3:[] , voz4:[] , voz5:[] , voz6: [], 
      n1 : "C4", n2: "C4", n3: "C4" , n4 : "C4" , n5: "C4", n6: "C4", enemigos1:0, enemigos2:0, enemigos3:0, 
      enemigos4:0, enemigos5:0, enemigos6:0}
    //let voz1, voz2, voz3, voz4, voz5, voz6, n1, n2, n3, n4, n5, n6, enemigos1, enemigos2, enemigos3, enemigos4, enemigos5, enemigos6
   this.handleMas = this.handleMas.bind(this)
   this.handleMenos = this.handleMenos.bind(this)
   this.masInvisible = this.masInvisible.bind(this)
   this.menosInvisible = this.menosInvisible.bind(this)
    
   this.init = true
   this.equipo = ""
   this.reserva = []
   this.voz1 = []
   this.voz2 = []
   this.voz3 = []
   this.voz4 = []
   this.voz5 = []
   this.voz6 = []
  }
  

  // Al clickar el botón 
  handleMas(i) {
    let r = Math.floor(Math.random() * (this.state.reserva.length))
    let desplazado = this.reserva[r]
    const voz = "voz" + i
    this.reserva.splice(this.reserva.indexOf(desplazado), 1)
    this["voz" + i].push(desplazado)
    let arg = this["voz" + i]
    this.setState({[voz] : arg})
    this.setState({reserva: this.reserva.length})
    // ENVIAR Info a server. Nombre usuario, voz a la que va. mi equipo. actualiza  a enemigos
    socket.emit("vozmas", desplazado, i, arg, this.equipo)
    
  }
  handleMenos(i) {
    let r = Math.floor(Math.random() * (this.state["voz" + i].length))
    const voz = "voz" + i
    let arr = this[voz]
    let desplazado = arr[r]
    this[voz].splice(this[voz].indexOf(desplazado), 1)
    this.reserva.push(desplazado)
    let arg = this.reserva
    this.setState({reserva: arg, [voz]: arr})
    console.log("reserva", this.reserva)
    // ENVIAR info a server. Nombre usuario. En el server se actualiza para enemigos
    socket.emit("vozmenos", desplazado, i, arr, this.equipo)
  }
  

  // funciones para cargar de forma condicional los botones de más y menos
  menosInvisible(i) {
    if (this["voz" + i].length > 0) {
      return (<button id = "botonMenos" onClick={this.handleMenos.bind(this,i)}>-</button>)
    }
    else {return <button id = "botonInvisible">-</button>}
  }
  masInvisible(i) {
    if (this.reserva.length > 0) {
      return (<button id = "botonMas" onClick={this.handleMas.bind(this, i)}>+</button>)
    }
    else {return <button id = "botonInvisible">+</button>}
  }
  

  render(){

    socket.on("enemigos", (voz, jugavoz)=> {
      
      console.log("i", voz)
      let enemigos = "enemigos" + voz
      console.log("enemigos", enemigos)
      let numero = jugavoz.length
      console.log(numero)
      this.setState({[enemigos]: numero})
    })


    socket.on("CapEquipo", (arg)=>{
      this.equipo = arg
      console.log("EQUIPO", this.equipo)
      
    })

    socket.on("reservas", (arg)=> {
      this.reserva = arg
      this.setState({reserva: arg})
      console.log("reserva", this.reserva)
    })

    socket.on("cambioNota", (voz, nota)=>{
      let n = "n" + voz
      this.setState({[n] : nota})
    })

    /*
    ronda is integer
    interp. en que ronda/fase del juego nos encontramos
    */

    /*
    miEquipo is String
    interp. en que equipo estoy

    let miEquipo = "caos"
    let miEquipo = "orden"

    atomic distinct 
    miEquipoFunction = socket.emit("CapEquipo?")
    socket.on("CapEquipo", (arg)=>{
      this.setState({miEquipo : arg})
    })
    */
    /*if (this.equipo === "") {
      socket.emit("CapEquipo?", userName)
      socket.on("CapEquipo", (arg)=>{
        this.equipo = arg
        console.log("EQUIPO", this.equipo)
      })
      this.setState({miEquipo: this.equipo})
      socket.emit("reservas?", this.equipo)
    }
    */
    if (this.init === true) {
      socket.emit("CapEquipo?", userName, (response)=>{
        this.equipo = response.status 
        socket.emit("reservas?", (this.equipo))
      })
      this.init = false
    }
    
    
  /*
  N is String
  interp. Nota asignada a cada voz

  N1 = "C4"

  atomic non distinct

  socket.on(N1, (arg)=>{
    this.setState({N1: arg})
  })
  */

  /*
  reserva is Array
  interp. lista de los jugadores sin posiciones asignadas

  reserva = ["manolo", "pepe"]

  enumeration

  socket
  
  */
  

  

  /*
  voz is Array
  interp. lista de los jugadores asignados a cada voz

  voz1 = 4
  voz3 = 0

  handleChange(event) {socket.emit("")}
  */
  
  /*
  enemigos is String
  inter. numero de jugadores enemigos asignados a cada voz

  enemigos1 = 2
  enemigos4 = 0


  */


  if (ronda === 1) {
    return(<div id= "padreVoces">
      <h2 id = "reserva">Jugadores sin asignar: {this.reserva.length}</h2>
      <div id= "flexVoces">
      <div class="voces">
        {this.menosInvisible(1)}
        <div class="voces2">
          <p id = "aliados">{this.state.voz1.length}</p>
          <p id = "notaCap">{this.state.n1}</p>
          <p id = "enemigos">{this.state.enemigos1}</p>
        </div>
        {this.masInvisible(1)}
      </div>

      <div class="voces">
        {this.menosInvisible(2)}
        <div class="voces2">
          <p id = "aliados">{this.state.voz2.length}</p>
          <p id = "notaCap">{this.state.n2}</p>
          <p id = "enemigos">{this.state.enemigos2}</p>
        </div>
        {this.masInvisible(2)}
      </div>

      <div class="voces">
        {this.menosInvisible(3)}
        <div class="voces2">
          <p id = "aliados">{this.state.voz3.length}</p>
          <p id = "notaCap">{this.state.n3}</p>
          <p id = "enemigos">{this.state.enemigos3}</p>
        </div>
        {this.masInvisible(3)}
      </div>

      <div class="voces">
        {this.menosInvisible(4)}
        <div class="voces2">
          <p id = "aliados">{this.state.voz4.length}</p>
          <p id = "notaCap">{this.state.n4}</p>
          <p id = "enemigos">{this.state.enemigos4}</p>
        </div>
        {this.masInvisible(4)}
      </div>

      <div class="voces">
        {this.menosInvisible(5)}
        <div class="voces2">
          <p id = "aliados">{this.state.voz5.length}</p>
          <p id = "notaCap">{this.state.n5}</p>
          <p id = "enemigos">{this.state.enemigos5}</p>
        </div>
        {this.masInvisible(5)}
      </div>

      <div class="voces">
        {this.menosInvisible(6)}
        <div class="voces2">
          <p id = "aliados">{this.state.voz6.length}</p>
          <p id = "notaCap">{this.state.n6}</p>
          <p id = "enemigos">{this.state.enemigos6}</p>
        </div>
        {this.masInvisible(6)}
      </div>
      </div>
    </div>)
    
  }
  }
}

class Combatiente extends React.Component {
  constructor(props) {
    super(props)
    this.state = { voz : 0 , n1 : <h2 id = "normal">C4</h2> , n2 : <h2 id = "normal">C4</h2>  , n3 :  <h2 id = "normal">C4</h2>  , n4 :  <h2 id = "normal">C4</h2>  , n5 :  <h2 id = "normal">C4</h2> , n6:  <h2 id = "normal">C4</h2> , mensaje: "", value: "" };
    this.nombreVoz = this.nombreVoz.bind(this)  
    this.handleChange = this.handleChange.bind(this)
    this.handleSubmit = this.handleSubmit.bind(this) 
    this.init = true
    this.n1 = "C4"
    this.n2 = "C4"
    this.n3 = "C4"
    this.n4 = "C4"
    this.n5 = "C4"
    this.n6 = "C4"
    
    
    
  }

  nombreVoz() {
    console.log("funciona", this.state.voz)
    
    if (this.state.voz === 0) {
      this.setState({mensaje: "Estás en la reserva"}) 
      this.setState({n1:<h2 id= "normal">{this.n1}</h2>, n2: <h2 id= "normal">{this.n2}</h2>,  n3: <h2 id= "normal">{this.n3}</h2>,  n4: <h2 id= "normal">{this.n4}</h2>,  n5: <h2 id= "normal">{this.n5}</h2> ,n6:<h2 id= "normal">{this.n6}</h2> })
    }
    else {
      let n = "n" + this.state.voz
      this.setState({mensaje: "Estás en la voz " + this.state.voz})
      this.setState({[n] : <h2 id= "resaltado">{this[n]}</h2>})
    }
  }

  handleChange(event) {    this.setState({value: event.target.value}); 
  console.log("value", this.state.value) }

  handleSubmit(event) {
    

    event.preventDefault();
    // se envía el evento username, para que el servidor almacene el nombre de usuario
    // se pregunta al servidor si el juego ha empezado
    console.log("propuesta enviada", this.state.value)

    socket.emit("propuestaNota", this.state.voz, this.state.value)
  }

  render() {
    
    socket.on("vozArm", (arg)=> {
      console.log("arg", arg)
      this.setState({voz: arg}, ()=> {console.log("estado", this.state.voz)
      this.nombreVoz()
    })
    })

    socket.on("cambioNota", (voz, nota)=> {
      let n = "n" + voz
      this[n] = nota
      if (voz === this.state.voz){
        this.setState({[n] : <h2 id = "resaltado">{nota}</h2>})
      } else {
      this.setState({[n] : <h2 id = "normal">{nota}</h2>})}
      
    })

    if (this.init === true){
      this.nombreVoz()
      this.init = false
    }
  
    // Algun tipo de función para que coloree nuestra nota
    return(
      <div>
        <h1 id= "armonia">Armonía</h1>
        <div id= "flexComb"><div id = "displayNotasComb"><h2 id = "conjuntoNotas">Conjunto de notas:</h2> <div id = "espaciadoNotas">{this.state.n1} {this.state.n2} {this.state.n3} {this.state.n4} {this.state.n5} {this.state.n6}</div></div> 
        <div id = "cuerpoComb"><p id = "mensajeReserva">{this.state.mensaje}</p>
        
          <label id = "labelPropuesta">
            Propón una nota 
          <input type= "text" id= "inputPropuesta" value={this.state.value} onChange={this.handleChange}></input>
          </label>
          <button type = "button" id = "botonPropuesta" onClick={this.handleSubmit} >Enviar!</button> 
        </div></div>
      </div>
    )
  }
}


// Componente de React para el host
class Host extends React.Component {
  constructor(props){
    super(props)
    socket.emit("puntos")
    this.puntosGanar = 10
    this.inicio = new Date()
    this.hora = Math.round((Date.now() - this.inicio)/1000)
    this.state = {tiempo: this.hora, puntosOrden: 0, puntosCaos: 0}
    this.cambio1 = this.cambio1.bind(this)
    this.cambio2 = this.cambio2.bind(this)
    this.cambio3 = this.cambio3.bind(this)
    this.cambio4 = this.cambio4.bind(this)
    this.cambio5 = this.cambio5.bind(this)
    this.cambio6 = this.cambio6.bind(this)
    this.formula = this.formula.bind(this)
    this.mecanismoCambio = this.mecanismoCambio.bind(this)
    this.botonAudio = this.botonAudio.bind(this)
    this.intervalo1 = this.formula()
    this.intervalo2 = this.formula()
    this.intervalo3 = this.formula()
    this.intervalo4 = this.formula()
    this.intervalo5 = this.formula()
    this.intervalo6 = this.formula()

    


    this.v1 = {orden: 0, caos: 0, pOrden: ["C4"], pCaos: ["C4"], uOrden: [], uCaos: [], notaGanadora: "C4", cambio: 0}
    this.v2 = {orden: 0, caos: 0, pOrden: ["C4"], pCaos: ["C4"], uOrden: [], uCaos: [], notaGanadora: "C4", cambio : 0}
    this.v3 = {orden: 0, caos: 0, pOrden: ["C4"], pCaos: ["C4"], uOrden: [], uCaos: [], notaGanadora: "C4", cambio : 0}
    this.v4 = {orden: 0, caos: 0, pOrden: ["C4"], pCaos: ["C4"], uOrden: [], uCaos: [], notaGanadora: "C4", cambio : 0}
    this.v5 = {orden: 0, caos: 0, pOrden: ["C4"], pCaos: ["C4"], uOrden: [], uCaos: [], notaGanadora: "C4", cambio : 0}
    this.v6 = {orden: 0, caos: 0, pOrden: ["C4"], pCaos: ["C4"], uOrden: [], uCaos: [], notaGanadora: "C4", cambio : 0}
    
    const r1 = new Tone.Reverb(10000)
    r1.wet.value = 1
    r1.toDestination()

    const pan1 = new Tone.Panner(-1).chain(r1).toDestination()
    const pan2 = new Tone.Panner(-0.6).chain(r1).toDestination()
    const pan3 = new Tone.Panner(-0.25).chain(r1).toDestination()
    const pan4 = new Tone.Panner(0.25).chain(r1).toDestination()
    const pan5 = new Tone.Panner (0.6).chain(r1).toDestination()
    const pan6 = new Tone.Panner(1).chain(r1).toDestination()
    
    this.osc1 = new Tone.Oscillator("C4").connect(pan1)
    this.osc2 = new Tone.Oscillator("C4").connect(pan2)
    this.osc3 = new Tone.Oscillator("C4").connect(pan3)
    this.osc4 = new Tone.Oscillator("C4").connect(pan4)
    this.osc5 = new Tone.Oscillator("C4").connect(pan5)
    this.osc6 = new Tone.Oscillator("C4").connect(pan6)

    this.osc1.volume.value = -18
    this.osc2.volume.value = -18
    this.osc3.volume.value = -18
    this.osc4.volume.value = -18
    this.osc5.volume.value = -18
    this.osc6.volume.value = -18

    this.osc1.start()
      this.osc2.start()
      this.osc3.start()
      this.osc4.start()
      this.osc5.start()
      this.osc6.start()

   

  }

  

  /// QUIZAS cambiar la frecuencia de update en función del numero de jugadores
  formula() {
    return(Math.round(((Math.random()+ 0.2) * 10000)) + Math.round(((Math.random() + 0.3) * 5000)))
  }
  componentDidMount(){
  
    if (ronda === 1){
    this.timerID = setInterval(()=> this.tick(), 1000)

    console.log("ID1 por tick", this.cambioID1)

    this.cambioID1 = setTimeout(()=> this.cambio1(), this.intervalo1)
    this.cambioID2 = setTimeout(()=> this.cambio2(), this.intervalo2)
    this.cambioID3 = setTimeout(()=> this.cambio3(), this.intervalo3)
    this.cambioID4 = setTimeout(()=> this.cambio4(), this.intervalo4)
    this.cambioID5 = setTimeout(()=> this.cambio5(), this.intervalo5)
    this.cambioID6 = setTimeout(()=> this.cambio6(), this.intervalo6)
  }
  }
  


  componentWillUnmount(){
    clearInterval(this.timerID)

  }

  tick(){
    this.hora = Math.round((Date.now() - this.inicio)/1000)
    console.log(this.hora)
    this.setState({tiempo : this.hora})
  }

  // BUG en esta función. ordenar el código. hacerlo mas pequeño y eficiente si se puede
  // localizar fuente del error
  
  mecanismoCambio(voz){
    // Variables
    let n = "v" + voz
    let participantes = this[n].caos + this[n].orden
    let ganador
    let equipoGanador 
    let notaInicial = this[n].notaGanadora
    
    

    //// VOTACIONES. 
    //// En caso de haber propuestas
    if (participantes !== 0) {


      // en caso de empate se tira moneda
      if (this[n].caos === this[n].orden){
        let moneda = Math.round(Math.random() + 1)
        if (moneda === 1){equipoGanador = "orden"} else {equipoGanador = "caos"}
      } else {
                  // en caso normal se asigna ganador
        if (this[n].caos > this[n].orden){
          ganador = this[n].caos
          equipoGanador = "caos"
          } else {ganador = this[n].orden
                equipoGanador = "orden"}
      }

      // se calculan porcentajes, el lado ganador tiene una ventaja extra
      let parte = 100 / participantes
      let porcentajeGanador = parte * (1.5 * ganador)

      
                // se ve quien ha ganado al final
      if ((Math.random() * 100) >= porcentajeGanador){
        if (equipoGanador === "caos"){
          equipoGanador = "orden"
          } else {equipoGanador = "caos"}
      } 

      // se elige la nota ganadora
      if (equipoGanador === "orden") {
        console.log("eligiendoOrden")
        let index = Math.floor(Math.random()* this[n].pOrden.length)
        this[n].notaGanadora = this[n].pOrden[index]           
      } 
        else {
          console.log("eligiendoCaos")
          let index = Math.floor(Math.random()* this[n].pCaos.length)
          this[n].notaGanadora = this[n].pCaos[index]
          console.log("index", index)
          console.log("")
        }
    } 

    /* 
    // en caso de inicio 
      if (participantes === 0) {porcentajeGanador = 0
                     equipoGanador = "caos"}

    */

    

          
            
    

    console.log("this", this[n], n)
    console.log("equipo", equipoGanador)
    console.log("nota", this[n].notaGanadora)

    socket.emit("cambiarNota", voz, this[n].notaGanadora)
    let notaG = this[n].notaGanadora
    let cambioNota
    if (notaInicial !== notaG) {
      cambioNota = 1
    } else {cambioNota = 0}
    this[n] = {orden: 0, caos: 0, pOrden: [], pCaos: [], uOrden: [], uCaos: [], notaGanadora: notaG, cambio: cambioNota }
    console.log(this[n])
  }

  cambio1() {
    console.log("cambio1")
    this.mecanismoCambio(1)
    if (this.v1.cambio === 1) {
      this.osc1.frequency.rampTo(this.v1.notaGanadora,Math.random()* 10)
      this.osc1.volume.rampTo(-18, Math.random()* 10 )
      let array = [1, this.v1.notaGanadora, this.state.tiempo]
      estructura.push(array)
    }
    this.intervalo1 = this.formula()
    this.cambioID1 = setTimeout(()=> this.cambio1(), this.intervalo1)
  }

  cambio2() {
    console.log("cambio2")
    this.mecanismoCambio(2)
    if (this.v2.cambio === 1) {
      this.osc2.frequency.rampTo(this.v2.notaGanadora,Math.random()* 10)
      this.osc2.volume.rampTo(-18, Math.random()* 10 )
      let array = [2, this.v2.notaGanadora, this.state.tiempo]
      estructura.push(array)
    }
    this.intervalo2 = this.formula()
    this.cambioID2 = setTimeout(()=> this.cambio2(), this.intervalo2)
  }

  cambio3() {
    console.log("cambio3")
    this.mecanismoCambio(3)
    if (this.v3.cambio === 1) {
      this.osc3.frequency.rampTo(this.v3.notaGanadora,Math.random()* 10)
      this.osc3.volume.rampTo(-18, Math.random()* 10 )
      let array = [3, this.v3.notaGanadora, this.state.tiempo]
      estructura.push(array)
    }
    this.intervalo3 = this.formula()
    this.cambioID3 = setTimeout(()=> this.cambio3(), this.intervalo3)
  }

  cambio4() {
    console.log("cambio4")
    this.mecanismoCambio(4)
    if (this.v4.cambio === 1) {
      this.osc4.frequency.rampTo(this.v4.notaGanadora,Math.random()* 10)
      this.osc4.volume.rampTo(-18, Math.random()* 10 )
      let array = [4, this.v4.notaGanadora, this.state.tiempo]
      estructura.push(array)
    }
    this.intervalo4 = this.formula()
    this.cambioID4 = setTimeout(()=> this.cambio4(), this.intervalo4)
  }

  cambio5() {
    console.log("cambio5")
    this.mecanismoCambio(5)
    if (this.v5.cambio === 1) {
      this.osc5.frequency.rampTo(this.v5.notaGanadora,Math.random()* 10)
      this.osc5.volume.rampTo(-18, Math.random()* 10 )
      let array = [5, this.v5.notaGanadora, this.state.tiempo]
      estructura.push(array)
    }
    this.intervalo5 = this.formula()
    this.cambioID5 = setTimeout(()=> this.cambio5(), this.intervalo5)
  }

  cambio6() {
    console.log("cambio6")
    this.mecanismoCambio(6)
    if (this.v6.cambio === 1) {
      this.osc6.frequency.rampTo(this.v6.notaGanadora,Math.random()* 10)
      this.osc6.volume.rampTo(-18, Math.random()* 10 )
      let array = [6, this.v6.notaGanadora, this.state.tiempo]
      estructura.push(array)
    }
    this.intervalo6 = this.formula()
    this.cambioID6 = setTimeout(()=> this.cambio6(), this.intervalo6)
  }

  botonAudio(){
    console.log("funciona", audioContext)
    if (audioContext === false) {
      console.log("contextoAudio")
      new Tone.Context()
      
      audioContext = true
    }
  }

  render(){
    socket.on("punto",(equipo)=>{
      if (equipo === "caos") {
        let n = this.state.puntosCaos + 1
        this.setState({puntosCaos: n})
        if (n === this.puntosGanar) {
          socket.emit("fin", "caos")
        }
      }
      if (equipo === "orden") {
        let n = this.state.puntosOrden + 1
        this.setState({puntosOrden: n})
        if (n === this.puntosGanar) {
          socket.emit("fin", "orden")
        }
      }
    })

    socket.on("puntosGanar", (puntos)=> {
      this.puntosGanar = puntos
    })

    socket.on("propuestaNota", (voz, nota, usuario, equipo) => {
      let n = "v" + voz
      let index
      if (equipo === "orden") {
      index = this[n].uOrden.indexOf(usuario)
      if (index > -1) {
        this[n].pOrden[index] = nota
      } else {
        this[n].pOrden.push(nota)
        this[n].uOrden.push(usuario)
        this[n].orden += 1
      }} 
      if (equipo === "caos"){
        index = this[n].uCaos.indexOf(usuario)
        if (index > -1) {
          this[n].pCaos[index] = nota
        } else {
          this[n].pCaos.push(nota)
          this[n].uCaos.push(usuario)
          this[n].caos += 1
        }
      }
      console.log("propuesta recibida", equipo, index, this[n].pOrden, this[n].pCaos)
    })
    if((this.state.puntosCaos + this.state.puntosOrden)%2 === 0){
      return(
        <div>
          
          <div>
            <div id= "espacioPuntosH"></div>
            <div id= "tablaPuntos">
            
            <h1 id = "puntosOrden">{this.state.puntosOrden}</h1>
        
            <h1 id = "puntosCaos">{this.state.puntosCaos}</h1>
            </div>
          </div>
        </div>
      )
    } else {
      return(
        <div>
          
          <div>
            <div id= "espacioPuntosH"></div>
            <div id= "tablaPuntos">
            
            <h1 id = "puntosOrden2">{this.state.puntosOrden}</h1>
        
            <h1 id = "puntosCaos2">{this.state.puntosCaos}</h1>
            </div>
          </div>
        </div>
      )
    }
    
  }
}

class Juez extends React.Component {

  constructor(props){
    super(props)
    this.state = {botonOrden: "", botonCaos: ""}
    this.votacion = this.votacion.bind(this)
    this.finVotacion = this.finVotacion.bind(this)
    this.votoOrden = this.votoOrden.bind(this)
    this.votoCaos = this.votoCaos.bind(this)
  }

  votoOrden() {
    
    let equipo = "orden"
    console.log("voto", equipo)
    socket.emit("voto", equipo)
    this.finVotacion()
  }

  votoCaos() {
    
    let equipo = "caos"
    console.log("voto", equipo)
    socket.emit("voto", equipo)
    this.finVotacion()
  }

  votacion() {
    console.log("hola")
    this.setState({botonOrden : <div id = "divJuezOrden"><input type= "button" id='botonOrden' value={"Orden"}  onClick={this.votoOrden}></input></div>})
    this.setState({botonCaos : <div id = "divJuezCaos"><input type= "button" id="botonCaos" value={"Caos"} onClick={this.votoCaos}></input></div>})
  }

  finVotacion() {
    console.log("adios")
    this.setState({botonOrden: "", botonCaos: ""})
    this.votosID = setTimeout(()=> this.votacion(), 15000)
  }


  componentDidMount(){
    this.votosID = setTimeout(()=> this.votacion(), 15000)
  }

  componentWillUnmount() {
    clearTimeout(this.votosID)
  }
  
  render() {


    return(
      <div id = "botonesJuez">
        {this.state.botonOrden}
        {this.state.botonCaos}
      </div>
    )
  }
  
}

// Componente de React para el juego, contiene el estado iniciado (boolean)
class Juego extends React.Component {
  constructor(props){
    super(props)
    console.log(juegoIniciado)
    this.state = {juegoIniciado : false, fin: false, equipoGanador: ""}
    this.reinicio = this.reinicio.bind(this)
    
  }

  reinicio() {
    juegoIniciado = false
  }

  componentWillUnmount() {
    clearTimeout(this.resetID)
  }
  // renderiza un evento socket de "iniciado" actualiza el estado si desde el server recibe que se inició
  // el juego

  // si no se ha iniciado el juego renderiza todo el proceso de logeo
  render() {
    socket.on("fin", (equipo)=>{  
      this.setState({fin: true, equipoGanador: equipo})
    })
    socket.on("iniciando", (arg)=> {
      console.log("argumento", arg)
      juegoIniciado = arg
      ronda = 1
      this.setState({juegoIniciado: juegoIniciado})
      console.log(this.state.juegoIniciado)
    })
    if (this.state.fin === true) {
      this.resetID = setTimeout(()=> this.reinicio(), 30000)
      ronda = 0
      audioContext = false
      return(
        
      <div>
        <h1>Ha ganado el equipo {this.state.equipoGanador}</h1>
        <h2>Gracias por jugar</h2>
      </div>
    )}
    else {
    if (juegoIniciado === false) {
      return (
      <LoginControl/>)
    } else {
      if (clase === "host"){ return(<Host/>)}
      if (clase === "Soldado"){ return(<Combatiente/>)}
      if (clase === "Capitan"){ return(<Capitan/>)}
      if (clase === "Juez"){ return(<Juez/>)}
    }}
  }
}



// Función principal
function App() {
  useEffect(() => {
    const favicon = document.getElementById('favicon');
    favicon.setAttribute('href', icon);
}, []);
  return(<Juego/>)
}

// exportamos la función para su uso en index.js
export default App