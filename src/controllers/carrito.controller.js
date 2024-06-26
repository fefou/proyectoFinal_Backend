import { cartsModelo } from '../dao/models/carts.model.js'
import { productsModelo } from '../dao/models/products.model.js'
import mongoose from 'mongoose'
import { ticketModelo } from '../dao/models/ticket.model.js';
import { usuariosModelo } from '../dao/models/users.model.js';

export class CarritoController {
  constructor() { }

  static async getCarrito(req, res) {
    let carritos = [];
    try {
      carritos = await cartsModelo
        .find({ deleted: false })
        .populate("products.product")
        .lean();
    } catch (error) {
      req.logger.error(error.message);
    }

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ carritos });
  }

  static async getCarritoById(req, res) {
    let { mensajeBienvenida } = req.query;
    let { cid } = req.params;
    if (!mongoose.isValidObjectId(cid)) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: `Indique un id válido` });
    }

    let existe;

    try {
      existe = await cartsModelo
        .findOne({ deleted: false, _id: cid })
        .populate("products.product")
        .lean();
    } catch (error) {
      res.setHeader("Content-Type", "application/json");
      return res
        .status(500)
        .json({ error: `Error al buscar carrito`, message: error.message });
    }

    if (!existe) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: `No existe carrito con id ${cid}` });
    }

    res.setHeader("Content-Type", "application/json");
    return res.status(200).json({ carrito: existe , mensajeBienvenida});
  }

  static async postCarrito(req, res) {
    let carrito = [];

    try {
      carrito = await cartsModelo.create({ productsModelo: [] });
    } catch (error) {
      req.logger.error("no se pudo crear un carrito", error.message);
    }
    res.setHeader("Content-Type", "application/json");
    res.status(201).json({ carrito });
  }

  static async postCarritoProducto(req, res) {
    let { cid, pid } = req.params;
    if (!mongoose.isValidObjectId(cid) || !mongoose.isValidObjectId(pid)) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: `Indique un id válido` });
    }

    let existeCarrito;
    try {
      existeCarrito = await cartsModelo.findOne({ deleted: false, _id: cid });
    } catch (error) {
      res.setHeader("Content-Type", "application/json");
      return res
        .status(500)
        .json({ error: `Error al buscar carrito`, message: error.message });
    }

    if (!existeCarrito) {
      res.setHeader("Content-Type", "application/json");
      return res.status(400).json({ error: `No existe carrito con id ${cid}` });
    }

    let existeProducto;
    try {
      existeProducto = await productsModelo.findOne({
        deleted: false,
        _id: pid,
      });
    } catch (error) {
      res.setHeader("Content-Type", "application/json");
      return res
        .status(500)
        .json({ error: `Error al buscar producto`, message: error.message });
    }

    if (!existeProducto) {
      res.setHeader("Content-Type", "application/json");
      return res
        .status(400)
        .json({ error: `No existe producto con id ${pid}` });
    }


    let resultado;
    let indice = existeCarrito.products.findIndex(
      (p) => p.product == existeProducto._id.toString()
    );
    if (indice === -1) {
      existeCarrito.products.push({ product: existeProducto._id, quantity: 1 });
    } else {
      existeCarrito.products[indice].quantity++;
    }

    try {
      resultado = await cartsModelo.updateOne(
        { deleted: false, _id: cid },
        existeCarrito
      );

      if (resultado.modifiedCount > 0) {
        res.setHeader("Content-Type", "application/json");
        return res.status(200).json({ payload: "modificación realizada" });
      } else {
        res.setHeader("Content-Type", "application/json");
        return res
          .status(200)
          .json({ message: "No se modificó ningún producto" });
      }
    } catch (error) {
      res.setHeader("Content-Type", "application/json");
      return res
        .status(500)
        .json({ error: `Error inesperado`, message: error.message });
    }
  }

  static async deleteCarritoProducto(req, res) {
    const { cid, pid } = req.params;

    try {
      const cart = await cartsModelo
        .findByIdAndUpdate(
          cid,
          { $pull: { products: { product: pid } } },
          { new: true, useFindAndModify: false }
        )
        .populate("products.product")
        .lean();

      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      return res.redirect(`/carts/${cid}?mensajeBienvenida=Producto eliminado`)
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async deleteCarrito(req, res) {
    const { cid } = req.params;

    try {
      const cart = await cartsModelo
        .findByIdAndUpdate(
          cid,
          { $set: { products: [] } },
          { new: true, useFindAndModify: false }
        )
        .lean();

      if (!cart) {
        return res.status(404).json({ message: "Cart not found" });
      }

      return res.redirect(`/carts/${cid}?mensajeBienvenida=Carrito Vaciado`);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async putCarritoProducto(req, res) {
    const { cid, pid } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ message: "Invalid quantity" });
    }

    try {
      const cart = await cartsModelo
        .findOneAndUpdate(
          { _id: cid, "products.product": pid },
          { $set: { "products.$.quantity": quantity } },
          { new: true, useFindAndModify: false }
        )
        .populate("products.product")
        .lean();

      if (!cart) {
        return res.status(404).json({ message: "Cart or product not found" });
      }

      res.status(200).json({ cart });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  static async comprarCarrito(req, res) {
    try {
      const cart = await cartsModelo.findById(req.params.cid).populate('products.product');

      if (cart.products.length === 0) {
        return res.status(400).json({ message: 'El carrito está vacío' });
      }

      const outOfStockProducts = [];

      const amount = cart.products.reduce((total, product) => {
        if (product.product.stock < product.quantity) {
          outOfStockProducts.push(product);
          return total;
        }

        product.product.stock -= product.quantity;
        return total + product.product.price * product.quantity;
      }, 0);

      if (outOfStockProducts.length === cart.products.length) {
        return res.status(400).json({ message: 'Todos los productos están sin stock' });
      }

      for (const product of cart.products) {
        await product.product.save();
      }

      const ticket = new ticketModelo({
        amount: amount,
        purchaser: req.user.email,
      });

      await ticket.save();

      cart.products = outOfStockProducts;
      await cart.save();

    
      return res.redirect(`/carts/${req.params.cid}?mensaje=compra realizada`);
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }

  }

}
