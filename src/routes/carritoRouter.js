import { Router } from 'express'
import path from 'path'
import __dirname from '../utils.js'
const routerC = Router()
let ruta = path.join(__dirname, '..', 'json', 'carritos.json')
import { CarritoController } from '../controllers/carrito.controller.js'



routerC.get('/', CarritoController.getCarrito)

routerC.get('/:cid', CarritoController.getCarritoById)



routerC.post('/', CarritoController.postCarrito)


routerC.post('/:cid/products/:pid', CarritoController.postCarritoProducto)

routerC.delete('/:cid/products/:pid', CarritoController.deleteCarritoProducto)

routerC.delete('/:cid', CarritoController.deleteCarrito)

routerC.put('/:cid/products/:pid', CarritoController.putCarritoProducto)



export default routerC