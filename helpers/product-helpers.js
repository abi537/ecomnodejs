
const { getDB } = require('../config/connection');  // Get MongoDB connection
var collection=require('../config/collection')


const { ObjectId } = require('bson');
const { response } = require('express');
const { dologin } = require('./user-helpers');
const bcrypt = require('bcrypt');
//const { ObjectId } = require('mongodb');

const AdminSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

// Function to insert product data into the "product" collection
async function insertProduct(productData) {
    const db = getDB();  // Get the connected database instance
    const productCollection = db.collection('product');  // Get the "product" collection

    try {
        // Insert the product data into the collection
        const result = await productCollection.insertOne(productData);
        console.log('Product inserted:', result);
    } catch (err) {
        console.error('Error inserting product:', err);
        throw err;
    }
}
async function getAllProducts() {
    const db = getDB();
    const productCollection = db.collection(collection.PRODUCT_COLLECTION);
    try {
        const products = await productCollection.find().toArray();
       // console.log('Fetched products:', products);
        return products;
    } catch (err) {
        console.error('Error fetching products:', err);
        throw err;
    }
}

async function deleteproduct(prodId) {
    const db = getDB();
    console.log(`Connecting to database to delete product with ID: ${prodId}`);

    try {
        const response = await db
            .collection(collection.PRODUCT_COLLECTION)
            .deleteOne({ _id: new ObjectId(prodId) });

        console.log('Delete operation result:', response);
        return response;
    } catch (error) {
        console.error('Error in deleteproduct helper:', error);
        throw error;
    }
}

async function getProductDetails(prodId){
    const db = getDB();
    console.log(`Connecting to database to Edit product with ID: ${prodId}`);
    const productCollection = db.collection(collection.PRODUCT_COLLECTION);
    try {
        const products = await productCollection.findOne({_id: new ObjectId(prodId)})
       // console.log('Fetched products:', products);
        return products;
    } catch (err) {
        console.error('Error for editing products:', err);
        throw err;
    }
}
async function updateproduct(prodId,productDetail,) {
    const db = getDB();
    console.log(`Connecting to database to update product with ID: ${prodId}`);
    const productCollection = db.collection(collection.PRODUCT_COLLECTION);


    
    try {
        const updateFields = {
            productname: productDetail.productname,
            description: productDetail.description,
            price: parseFloat(productDetail.price),
            category: productDetail.category,
            ...(productDetail.image && { image: productDetail.image }), // Include image if provided
        };
        // Include image field only if a new image is provided
        if (productDetail.image) {
            updateFields.image = productDetail.image;
        }

         // Update the product in the database

        const result = await productCollection.updateOne(
            { _id: new ObjectId(prodId) },
            { $set: updateFields }
        );

        console.log('Update Result:', result);
        if (result.matchedCount > 0) {
            if (result.modifiedCount > 0) {
                console.log('Product updated successfully');
                return { success: true, message: 'Product updated' };
            } else {
                console.log('No changes were made as the new values are identical to the existing ones');
                return { success: true, message: 'No changes were made' };
            }
        } else {
            console.log('No product was found with this ID');
            return { success: false, message: 'No product found with this ID' };
        }

        
    } catch (err) {
        console.error('Error updating product:', err);
        throw err;
    }
}

async function getProductById(prodId) {
    const db = getDB(); // Get the MongoDB connection
    console.log(`Connecting to database to fetch product with ID: ${prodId}`);

    try {
        // Fetch the product document by its ObjectId
        const productCollection = db.collection(collection.PRODUCT_COLLECTION);
        const product = await productCollection.findOne({ _id: new ObjectId(prodId) });

        if (!product) {
            console.log('Product not found with this ID:', prodId);
            return null;
        }

        console.log('Fetched product:', product);
        return product;
    } catch (err) {
        console.error('Error fetching product by ID:', err);
        throw err; // Re-throw the error for higher-level handling
    }
}
async function doadminlogin(admindata) {
    return new Promise(async (resolve, reject) => {
        let response={}
          try {
            const db = getDB();
            
            // Fetch the user by email
            const admin = await db.collection(collection.ADMIN_COLLECTION).findOne({ Email: admindata.Email });
            
            // Check if user exists
            if (!admin) {
             
              return resolve({ status: false, message: 'admin not found' });
              //throw new Error('User not found');
             // console.log('User not found');
             // return reject('User not found');
            }
    
            // Compare the provided password with the stored hashed password
            const isMatch = await bcrypt.compare(admindata.Password, admin.Password);
            
           // if (isMatch) {
            //  console.log('Login successful');
             // resolve(user);
           // } else {
            //  console.log('Incorrect password');
             // reject('Incorrect password');
           // }
          //} catch (err) {
            ///console.error('Login error:', err);
           // reject('An error occurred during login');
         // }
        //});
        
         // If the password doesn't match, throw an error
         if (!isMatch) {
          
          return resolve({ status: false, message: 'Incorrect password' });
    
          //throw new Error('Incorrect password');
        }
    
        console.log('Login successful');
        response.admin=admin
        response.status=true
        resolve(response)
        //return user;
      } catch (err) {
        console.error('Error during login:', err.message);
       response.status=false
       response.message =  resolve({ status: false, message: 'An error occurred during login on' });'An error occurred during login';
    
       //resolve(response)nokkanam?
        //throw err;
      }
    
    
      })}

  


async function doadminsignup(admindata) {
     return new Promise(async (resolve, reject) => {
          try {
            // Ensure userdata.Password is defined before hashing
            if (!admindata.Password) {
              return reject({ status: false, message: 'Password is required' });
              //throw new Error('Password is required');
            }
            
            // Hash the password
            admindata.Password = await bcrypt.hash(admindata.Password, 10);
    
            // Insert the user data into the MongoDB collection
            const db = getDB();
            const result = await db.collection(collection.ADMIN_COLLECTION).insertOne(admindata);
           
            if (result.insertedId) {
              resolve({ status: true, admin: admindata }); // Return the user data (excluding sensitive info) if needed.
            } else {
              resolve({ status: false, message: 'Signup failed. Please try again.' });
            }
    
    
    
            // Return the inserted document
            //resolve(result.insertedId);
    
          } catch (err) {
            console.error('Signup error:', err.message);
            reject({ status: false, message: 'Signup failed' });
            //reject(err);
          }
        });
      }
    
   




module.exports = {
    insertProduct,
    getAllProducts,
    deleteproduct,
    getProductDetails,
    updateproduct,
    getProductById,
    doadminlogin,
    doadminsignup

    
};



//module.exports = { insertProduct };
///module.exports = { getAllProducts };
//module.exports = { deleteproduct };