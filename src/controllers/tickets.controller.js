
import { enviarEmail } from "../mails/mail.js";
import { config } from '../config/config.js'
import jwt from "jsonwebtoken";
import { ticketModelo } from "../dao/models/ticket.model.js";
import { usuariosModelo } from "../dao/models/users.model.js";


export class ticketsController {
  constructor() { }

  static async getTickets(req, res) {
    try {
      const tickets = await ticketsModelo.find();
      res.json(tickets);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async getTicketById(req, res) {
    try {
      const ticket = await ticketsModelo.findById(req.params.tid);
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async postTicket(req, res) {
    try {
      const ticket = new ticketsModelo(req.body);
      await ticket.save();
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async putTicket(req, res) {
    try {
      const ticket = await ticketsModelo.findByIdAndUpdate(
        req.params.tid,
        req.body,
        { new: true }
      );
      res.json(ticket);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteTicket(req, res) {
    try {
      const ticket = await ticketsModelo.findByIdAndDelete(req.params.tid);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async emailTicket(req, res) {

    req.session.usuario = {
      nombre: req.user.first_name,
      email: req.user.email,
      rol: req.user.rol,
      carrito: req.user.cartId
    };

    let email = req.user.email
    let mensaje = `Su compra se ha realizado correctamente`
    let cartId = req.user.cartId

    let usuario = await usuariosModelo.findOne({ email }).lean()
    if (!usuario) {
      res.setHeader('Content-Type', 'application/json');
      return res.status(400).kson({ error: `No existe el email: ${email}` })
    }
    delete usuario.password
    let token = jwt.sign({ ...usuario }, config.SECRET, { expiresIn: "1h" })

    let respuesta = await enviarEmail(email, "Compra realizada", mensaje)
    res.status(200).json({ redirectTo: `/carts/${cartId}?mensajeBienvenida=Su compra se ha realizado correctamente, se le enviará un mail a su casilla confirmando la compra.`});

  }


}
