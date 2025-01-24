const { getDB } = require('../config/connection'); // Get MongoDB connection
const collection = require('../config/collection');
const bcrypt = require('bcrypt');
//const { ObjectId } = require('bson');
const { ObjectId } = require('mongodb');
const { log } = require('handlebars/runtime');
const Razorpay = require('razorpay');
const { promiseHooks } = require('v8');

var instance= new Razorpay({
  key_id:'rzp_test_jEGm7l4y3shnFP',
  key_secret:'oT45SNitQTkCWurBRKs0Wanr',

})

module.exports = {
  dosignup: async (userdata) => {
    return new Promise(async (resolve, reject) => {
      try {
        // Ensure userdata.Password is defined before hashing
        if (!userdata.Password) {
          return reject({ status: false, message: 'Password is required' });
          //throw new Error('Password is required');
        }
        
        // Hash the password
        userdata.Password = await bcrypt.hash(userdata.Password, 10);

        // Insert the user data into the MongoDB collection
        const db = getDB();
        const result = await db.collection(collection.USER_COLLECTION).insertOne(userdata);
       
        if (result.insertedId) {
          resolve({ status: true, user: userdata }); // Return the user data (excluding sensitive info) if needed.
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
  },
  dologin: async (userdata) => {
  
    return new Promise(async (resolve, reject) => {
    let response={}
      try {
        const db = getDB();
        
        // Fetch the user by email
        const user = await db.collection(collection.USER_COLLECTION).findOne({ Email: userdata.Email });
        
        // Check if user exists
        if (!user) {
         
          return resolve({ status: false, message: 'User not found' });
          //throw new Error('User not found');
         // console.log('User not found');
         // return reject('User not found');
        }

        // Compare the provided password with the stored hashed password
        const isMatch = await bcrypt.compare(userdata.Password, user.Password);
        
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
    response.user=user
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


  })},
addtocart:(proId,userId)=>{
  const db = getDB();

    const proObj = {
        item: new ObjectId(proId),
        quantity: 1,
    };

    return new Promise(async (resolve, reject) => {
        try {
            // Find user's cart
            const userCart = await db.collection(collection.CART_COLLECTION).findOne({ user: new ObjectId(userId) });

            if (userCart) {
                // Check if the product already exists in the cart
                const productExists = userCart.product.findIndex(product => product.item.toString() === proId) !== -1;
                console.log('the produexisthhhhhhh',productExists)

                if (productExists) {
                    // If product exists, update the quantity
                    await db.collection(collection.CART_COLLECTION).updateOne(
                        { user: new ObjectId(userId), "product.item": new ObjectId(proId) },
                        {
                            $inc: { "product.$.quantity": 1 }, // Increment quantity
                        }
                    );
                    resolve({ message: 'Product quantity updated' });
                } else {
                    // If product doesn't exist, push it to the product array
                    await db.collection(collection.CART_COLLECTION).updateOne(
                        { user: new ObjectId(userId) },
                        {
                            $push: { product: proObj },
                        }
                    );
                    resolve({ message: 'Product added to cart' });
                }
            } else {
                // If user cart doesn't exist, create a new cart
                const cartObj = {
                    user: new ObjectId(userId),
                    product: [proObj],
                };

                await db.collection(collection.CART_COLLECTION).insertOne(cartObj);
                resolve({ message: 'Cart created and product added' });
            }
        } catch (err) {
            console.error('Error adding to cart:', err);
            reject(err);
        }
    });
}


,

 
  getcartproducts:(userId)=>{
    console.log('getcartproductsuserid',userId) //vannand 67331184afcd161bfda542b5
    const db = getDB();
    return new Promise(async(resolve,reject)=>{
      let cartItem= await db.collection(collection.CART_COLLECTION).aggregate([
        {
          $match:{user:new ObjectId(userId)}
        },
        {
          $unwind:'$product'
        },
        {
          $project:{
            item:'$product.item',
            quantity:'$product.quantity'
          }
        },
        {
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
          }

          
        },
        {
          $project:{
            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
          }
        }

        
        //{
         // $lookup:{
          //  from:collection.PRODUCT_COLLECTION,
           // let:{prodlist:'$product'},
           // pipeline:[
           //   {
            //     $match:{
             //     $expr:{
             //       $in:['$_id','$$prodlist']//product collection _id to the collection of product id in cart
             //     }
             //    }
             // }
//],
           // as:'cartItem'

            

            
        //  }
      //  }
      ]).toArray()
      console.log("the cartitem",cartItem);
     // console.log('the producttttt',cartItem[0].product);
      
      resolve(cartItem)
    })

  },
  getcartcount:(userId)=>{
    const db = getDB();
    return new Promise(async(resolve,reject)=>{
      count=0;
      let cart=await  db.collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
      if (cart){
        count=cart.product.length
      }
      resolve(count)


    })
  },
  changeproductquantity:(details)=>{
    //details.cart = validateAndSanitizeId(details.cart)
    console.log('yaahhooo',details);
    details.count=parseInt(details.count)
    details.quantity=parseInt(details.quantity)
    
    const db = getDB();
   console.log("the contant of detail ",details);
   
   return new Promise(async(resolve,reject)=>{
   
    if(details.count==-1 && details.quantity==1){
      console.log('enter to the -1 case');
      
      db.collection(collection.CART_COLLECTION)
      .updateOne({_id: new ObjectId(details.cart)},
    {
      $pull:{product:{item:new ObjectId(details.product)}}
    }).then((response)=>{
      resolve({removeproduct:true})
    })
    }else{
    
      console.log('enter to the else case');
      

   db.collection(collection.CART_COLLECTION).updateOne(
      { _id: new ObjectId(details.cart), "product.item":  new ObjectId(details.product) },
      {
          $inc: { "product.$.quantity": details.count }, // Increment quantity
      }
  ).then((response)=>{
    console.log('issuuue',response);
    resolve({status:true})
      
    
    
  })
}

   })

  
  },
  gettotalamount:(userId)=>{
    const db = getDB();
    
    console.log('userid**',userId) //vannand
    return new Promise(async(resolve,reject)=>{
      let totals= await db.collection(collection.CART_COLLECTION).aggregate([
        {
          $match:{user:new ObjectId(userId)}
        },
        {
          $unwind:'$product'
        },
        {
          $project:{
            item:'$product.item',
            quantity:'$product.quantity'
          }
        },
        {
          $lookup:{
            from:collection.PRODUCT_COLLECTION,
            localField:'item',
            foreignField:'_id',
            as:'product'
          }

          
        },
        {
          $project:{
            item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
          }
        },
        {
          $group:{
            _id:null,
            totals:{$sum:{$multiply:['$quantity',  '$product.price' ]}}
          }
        }
      ]).toArray()
      //console.log(product);
      
      console.log("thee",totals);
      if(totals){
      resolve(totals[0].totals)
      }else{
        
      }
      
    })

  },

  placeorder:(order,product,totalprice)=>{
    const db = getDB();
    return new Promise(async(resolve,reject)=>{
      console.log('orders',order,'product',product,'totalprice',totalprice);
      let status=order['payment-method']==='COD'?'placed':'pending'
      let orderobj={
        delivarydetails:{
          mobile:order.mobile,
          address:order.Address,
          pincode:order.pincode,
          totalamount:totalprice,
          date:new Date()
        },
        userId: new ObjectId(order.userid),
        paymentmethod:order['payment-method'],
        product:product,
        status:status
      }
      console.log('orderobj',orderobj);
      console.log('id finding',new ObjectId(order.userid));
      
      db.collection(collection.ORDER_COLLECTION).insertOne(orderobj).then((response)=>{
        console.log('the 1res order  idddd',response);
        db.collection(collection.CART_COLLECTION).deleteOne({user:new  ObjectId (order.userid)},(err, result) => {
          if (err) {
            console.error("Error deleting document:", err);
          } else {
            console.log("Document deleted successfully:", result);
          }
        })

        console.log('the res order  idddd',response);
        //console.log('the order o idddd',response.ops[0]._id);
        console.log('the order 1nsertedid idddd',response.insertedId);
        
        resolve(response.insertedId)
      })
      

    })

  },
  getcartproductslist:(userId)=>{
    const db = getDB();
    return new Promise(async(resolve,reject)=>{
      let cart=await db.collection(collection.CART_COLLECTION).findOne({user:new ObjectId(userId)})
      console.log('the postammma',cart.product);
      console.log('the postammma2',cart);
      
      
      resolve(cart.product)
    })
  },

  getuserorders:(userId)=>{
    console.log('the userid',userId);
    
    const db = getDB();
    return new Promise(async(resolve,reject)=>{
      let orders = await db.collection(collection.ORDER_COLLECTION).find({userId:new ObjectId (userId)}).toArray()
      console.log('the ordersssssssssssssss',orders);
      resolve(orders)
      
    
})

},
getorderproducts:(orderId)=>{
  const db = getDB();
  return new  Promise(async(resolve,reject)=>{
    console.log('orderid',orderId);
    
    let orderitems= await db.collection(collection.ORDER_COLLECTION).aggregate([
      {
        $match:{_id:new ObjectId(orderId)}
      },
      {
        $unwind:'$product'
      },
      {
        $project:{
          item:'$product.item',
          quantity:'$product.quantity'
        }
      },
      {
        $lookup:{
          from:collection.PRODUCT_COLLECTION,
          localField:'item',
          foreignField:'_id',
          as:'product'
        }

        
      },
      {
        $project:{
          item:1,quantity:1,product:{$arrayElemAt:['$product',0]}
        }
      },
      
    ]).toArray()
    //console.log(product);
    
    console.log("theeyannn",orderitems);
    resolve(orderitems)
    
  })
  },

  generaterazorpay:(orderid,total)=>{
    return new Promise((resolve,reject)=>{
      var options={
        amount: total*100,
        currency:'INR',
        receipt:''+orderid
      

      }
      instance.orders.create(options,function(err,order){
        if(err){
          console.log(err)

          }else{
            console.log('new order',order);
            
          }
          resolve(order)
      })
      
    })
  },
verifypayment :(details)=>{
 // const crypto = require('crypto');
  return new Promise((resolve,reject)=>{
    const crypto = require('crypto');
    let hmac=crypto.createHmac('sha256','oT45SNitQTkCWurBRKs0Wanr')
    hmac.update(details['payment[razorpay_order_id]']+'|'+ details['payment[razorpay_payment_id]'])
   hmac=hmac.digest('hex')
   if(hmac==details['payment[razorpay_signature]']){
    resolve()

   }else{
    reject()
   }


   

    
})
},
changepaymentstatus:(orderId)=>{
  const db = getDB();
  return new Promise ((resolve,reject)=>{
    db.collection(collection.ORDER_COLLECTION)
    .updateOne({_id:new ObjectId(orderId)},
    {
      $set:{
        status:'placed'
      }
    }
  ).then(()=>{
    resolve()
  })
  })

}



}


