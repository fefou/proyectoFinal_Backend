
const socket = io()

socket.on("productos", productos=> {
    req.logger.info(productos)

document.location.href='/realtimeproducts'
   
})
