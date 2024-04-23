import { expect } from "chai";
import { describe, it } from "mocha";
import mongoose from "mongoose";
import supertest from "supertest";
import { config } from "dotenv";

await mongoose.connect ('mongodb+srv://ffedecairo:CoderCoder@cluster0.uazzwoe.mongodb.net/?retryWrites=true&w=majority&dbName=ecommerce')

const requester = supertest(`http://localhost:/${process.env.PORT}`)


describe("Prueba proyecto de Tienda", async function(){

    this.timeout(5000)

    describe("Prueba del router de Carrito", async function(){

        after(async()=>{
            // let resultado=await mongoose.connection.collection("pets").deleteMany({specie:"TESTING"})
            // console.log(resultado)
        })

        it("La ruta /api/carts, en su metodo POST, permite crear un nuevo carrito ",async()=>{

            let carrito=[{name:"Suertudo",specie:"TESTING",birthDate:"2000-03-03"}]

            // let resultado=await requester.post("/api/pets").send(mascota)
            // console.log(resultado)
            let {statusCode, body, ok}=await requester.post("/api/pets").send(mascota)

            expect(statusCode).to.be.equal(200)
            expect(ok).to.be.true
            expect(body.payload._id).to.exist
            expect(body.status).to.exist.and.to.be.equal("success")

        })

    })
    

})