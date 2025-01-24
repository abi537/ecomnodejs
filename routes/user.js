var express = require('express');
var router = express.Router();

const { insertProduct } = require('../helpers/product-helpers');
//const { getAllProducts } = require('../controllers/productController');
const {  getAllProducts } = require('../helpers/product-helpers');
const userhelpers=require('../helpers/user-helpers')
const verifyLogin = (req, res, next) => {
    // Check if session and user object exist
    if (req.session && req.session.user && req.session.user.loggedIn) {
        next(); // Proceed to the next middleware or route handler
    } else {
        res.redirect('/login'); // Redirect to login if not logged in
    }
};








/* GET home page. */
router.get('/', async function(req, res, next) {
    let user=req.session.user
    console.log(user)
    let cartcount=null;
    if(req.session.user){
     cartcount=await userhelpers.getcartcount(req.session.user._id)
    }

  console.log('Admin route accessed'); // Log for debugging
  res.set('Cache-Control', 'no-store');

  try {
      // Fetch products from the database
      const products = await getAllProducts();
      console.log('Products to render:', products); // Log the fetched products

      // Render the admin view with the fetched products
      res.render('user/view-products', { product: products, user ,cartcount});
  } catch (err) {
      console.error('Error rendering admin:', err);
      // Send error response if an issue occurs
      res.status(500).send('Error fetching products');
  }

 

  
 // res.render('index', { product,admin:false}  );
});
router.get('/login',(req,res)=>{
    if( req.session.user){
        res.redirect('/')
    }else{
        const loginError = req.session.userloginError;
  req.session.userloginError = null; // Clear the error after displaying
    res.render('user/login', {loginError})
    }

    
})
router.get('/signup',(req,res)=>{
    res.render('user/signup')

})
router.post('/signup',(req,res)=>{
    userhelpers.dosignup(req.body).then((response)=>{
        console.log(req.body);
        console.log(response)
        req.session.user.loggedIn=true;
        //req.session.user=response.user
        req.session.user=response 
            res.redirect('/login')
        
        
    })

})

router.post('/login',(req,res)=>{
   userhelpers.dologin(req.body).then((response)=>{
    if(response.status){
       
        req.session.user=response.user
        req.session.user.loggedIn=true;
        res.redirect('/')
    }else{
        req.session.userloginError="Inavalid username or password"
        //return res.render('user/login', { loginError: response.message });
        //console.error('Login failed:', response.message);
       // req.session.loginerr=response.message
       res.redirect('/login')

    }
   })
   .catch(err => {
    console.error('Unhandled login error:', err.message);
    return res.render('user/login', { loginError: 'An error occurred during login' });
    //req.session.loginError = 'An error occurred during login';
    //es.redirect('/login');
  });
    })

    router.get('/logout',(req,res)=>{
        req.session.user=null;
       // req.session.userloggedIn=false
        res.redirect('/login')
    
    })
    
    router.get('/cart',verifyLogin,async(req,res)=>{
        let product=await userhelpers.getcartproducts(req.session.user._id)
        let totalvalue=0;
        if(product.length>0){
            totalvalue=await userhelpers.gettotalamount(req.session.user._id)

        }
         
        console.log('the cart product',product)
       console.log("ya buudyyy",req.session.user._id)//vannanddd67331184afcd161bfda542b5
       
      // res.render('user/cart',{product,user:req.session.user,totalvalue});

       res.render('user/cart',{product,user:req.session.user,totalvalue})
    })

    router.get('/add-to-cart/:id',(req,res)=>{
        console.log('api caall')

        userhelpers.addtocart(req.params.id,req.session.user._id).then(()=>{
            //res.send({ status: true });
            res.json({status:true})
            //res.redirect('/')
        })//which product and which user
    })
    router.post('/change-product-quantity',(req,res,next)=>{
        console.log('oo',req.body);
        
        userhelpers.changeproductquantity(req.body).then(async(response)=>{
            console.log('the req.bodyy',req.body)
            console.log('the req.bodyy userrr',req.body.user)
          response. total=await userhelpers.gettotalamount(req.body.user)
            console.log("neesaaa",response.total)
            console.log('my res',response);
          

            res.json(response)

          
        })

    })

    router.get('/place-order',verifyLogin,async(req,res)=>{
       let sum=await userhelpers.gettotalamount(req.session.user._id)
  console.log('huuuuuu',sum)
       res.render('user/place-order',{sum,user:req.session.user})
    })
    router.post('/place-order',verifyLogin,async(req,res)=>{
        let product=await userhelpers.getcartproductslist(req.session.user._id)
        let totalprice=await userhelpers.gettotalamount(req.session.user._id)
        userhelpers.placeorder(req.body,product,totalprice).then((orderId)=>{
            if(req.body['payment-method']==='COD'){
            res.json({codpayment:true})
            }else{
                userhelpers.generaterazorpay(orderId,totalprice).then((response)=>{
                res.json(response)
                })
            }

        })
        console.log(req.body);
        
    })

    router.get('/order-success',(req,res)=>{
        res.render('user/order-status',{user:req.session.user})
    })
    router.get('/orders',verifyLogin,async(req,res)=>{
     let  orders= await userhelpers.getuserorders(req.session.user._id)
        res.render('user/orders',{user:req.session.user, orders})
       
    })
    router.get('/view-order-products/:id',async(req,res)=>{
        let product=await userhelpers.getorderproducts(req.params.id)
        console.log('lighteightttttt',product);
        
        res.render('user/view-order-products',{user:req.session.user,product})

    })
    router.post('/verify-payment',(req,res)=>{
        console.log('the verify apayment',req.body);
        userhelpers.verifypayment(req.body).then(()=>{
            userhelpers.changepaymentstatus(req.body['order[receipt]']).then(()=>{
                console.log('payment successfull');
                
                res.json({status:true})
            })
            
        }).catch((err)=>{
            console.log(err);
            res.json({status:false})
            
        })











        

        
        
    })


 

module.exports = router;
