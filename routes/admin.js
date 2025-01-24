var express = require('express');
const { insertProduct, getProductDetails,updateproduct,getProductById,doadminlogin, doadminsignup} = require('../helpers/product-helpers');
const { deleteproduct } = require('../helpers/product-helpers');
var router = express.Router();
const { ObjectId } = require('mongodb');
const path = require('path');

const fs = require('fs');
const producthelpers=require('../helpers/product-helpers')


const { getAllProducts } = require('../helpers/product-helpers')

//const { getAllProducts } = require('../controllers/productController');

//var producthelpers=require('../helpers/product-helpers')

const bodyParser = require('body-parser');
const { log } = require('console');

const verifyadminLogin = (req, res, next) => {
    if (req.session && req.session.adminloggedIn) {
        next(); // Proceed if admin is logged in
    } else {
        res.redirect('/admin/login'); // Redirect to admin login page
    }
};

/* GET users listing. */
router.get('/',verifyadminLogin, async function (req, res, next) {
   

    console.log('Admin route accessed'); // Log for debugging
    res.set('Cache-Control', 'no-store');
    let admin=req.session.admin
    console.log(admin)
    //let cartcount=null;
   
    

    try {
        
        // Fetch products from the database
        const products = await getAllProducts();
       // console.log('Products to render:', products); // Log the fetched products

        // Render the admin view with the fetched products
        res.render('admin/view-products', { product: products, admin: true });
    } catch (err) {
        console.error('Error rendering admin:', err);
        // Send error response if an issue occurs
        res.status(500).send('Error fetching products');
    }

});


router.get('/login',(req,res)=>{
    if( req.session.admin){
        
        res.redirect('/')
    }else{
        const loginError = req.session.adminloginError;
  req.session.adminloginError = null; // Clear the error after displaying
    res.render('admin/login', {loginError})
    }

    
})

router.post('/login',async(req,res)=>{
    const response = await doadminlogin(req.body)
  //producthelpers.doadminlogin(req.body).then((response)=>{
    if(response.status){

       // req.session.admin = { loggedIn: true, ...response.admin }; // Ensure `loggedIn` is explicitly set
       // req.session.adminloggedIn=true;

        req.session.admin=response.admin

        req.session.adminloggedIn=true;
        
        res.redirect('/admin')
    }else{
        req.session.adminloginError="Inavalid username or password"
        //return res.render('user/login', { loginError: response.message });
        //console.error('Login failed:', response.message);
       // req.session.loginerr=response.message
       res.redirect('/admin/login')

    }
   })


   //.catch(err => {
   /// console.error('Unhandled login error:', err.message);
   // return res.render('user/login', { loginError: 'An error occurred during login' });
    //req.session.loginError = 'An error occurred during login';
    //es.redirect('/login');
  //});
   // })



 
//});
router.get('/signup',(req,res)=>{
    res.render('admin/signup')

})
router.post('/signup',async(req,res)=>{
    const response = await doadminsignup(req.body)
   // userhelpers.doadminsignup(req.body).then((response)=>{
        console.log(req.body);
        console.log(response)
        req.session.adminloggedIn=true;
        //req.session.user=response.user
        req.session.user=response 
            res.redirect('/login')
        
        
    })

//})






router.get('/add-product',function(req,res){

  res.render('admin/add-product')
})
router.post('/add-product',async (req, res) => {
    console.log('the req body of add product',req.body)
  // Extract product data from form
  
  let { productname, price, description, category } = req.body;
  price=Number(price);
  //const price = Number(req.body.price); // Converts the price to a number
console.log('type of price',typeof price); // Should now log 'number'
  const image = req.files ? req.files.image : null;  // Get the uploaded image (if any)

  if (!image) {
      return res.status(400).send("No image uploaded");  // Handle the case where no image is uploaded
  }

  // Set up the image file path (you can modify this as needed)

  //const imagePath = `./public/product-images/${image.name}`;
  //const imagePath = `/product-images/${Date.now()}-${image.name}`;
  //const imagePath = path.join(__dirname, '../public/product-images', `${Date.now()}-${image.name}`);
  const imagePath = path.join(__dirname, '../public/product-images', image.name);



  // Move the uploaded image to a desired folder
  image.mv(imagePath, async (err) => {
      if (err) {
          return res.status(500).send("Error uploading file");
      }
      //const imageURL = `/product-images/${Date.now()}-${image.name}`;
      const imageURL = `/product-images/${image.name}`;  // Store only the file name in the database


      // Insert the product data (including the image path) into the database
      try {
          await insertProduct({
              productname,
              price,
              description,
              category,
              image: imageURL,  // Store the image path in the database
             // image: `/product-images/${Date.now()}-${image.name}`,
          });

          console.log('Product inserted into database');
          res.redirect('/admin'); // Redirect to the view products page (or wherever you need)
      } catch (err) {
          console.error('Error inserting product:', err);
          res.status(500).send('Error inserting product');
      }
  });
});

router.post('/delete-product', async (req, res) => {
    const proId = req.body.id;
    console.log(`Attempting to delete product with ID: ${proId}`);

    // Step 1: Validate if the ID is a valid ObjectId
    if (!ObjectId.isValid(proId)) {
        console.log('Invalid ObjectId');
        return res.status(400).json({ message: 'Invalid product ID' });
    }

    try {
        // Step 2: Call the deleteproduct function
        const response = await deleteproduct(proId);
        console.log('Delete Response:', response);

        // Step 3: Check the response from the delete operation
        if (response.deletedCount > 0) {
            console.log('Product deleted successfully');
            res.redirect('/admin/');
           // return res.status(200).json({ message: 'Product deleted successfully' });
            

 
        } else {
            console.log('Product not found');
            return res.status(404).json({ message: 'Product not found' });
        }


    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ message: 'Internal server error' });
    }
});
router.get('/edit-product/:id',async(req,res)=>{
    const proId = req.params.id;
    console.log(`Attempting to edit product with ID: ${proId}`);
    if (!ObjectId.isValid(proId)) {
        console.log('Invalid ObjectId');
        return res.status(400).json({ message: 'Invalid product ID' });
    }
    try {
        // Step 2: Call the getProductDetails function
        const response = await getProductDetails(proId);
        if (response.image) {
            response.image = response.image.trim().replace(/^\/+/, '');
        }
        
        // Ensure the path does not contain double slashes
        if (response.image.startsWith('/')) {
            response.image = response.image.slice(1);
        }
        
        
        console.log('Edit Response:', response);
        res.render('admin/edit-product',{response})
    }catch (error) {
            console.error('Error editing the product:', error);
            return res.status(500).json({ message: 'Internal server error' });
        }

    
})
router.post('/edit-product/:id', async (req, res) => {
    try {
        const prodId = req.params.id;
        const productDetail = req.body;
        const newImageFile = req.files?.image;
        let imagePath;

        // Ensure the directory exists
        const imageDir = path.join(__dirname, '..', 'public', 'product-images');
        if (!fs.existsSync(imageDir)) {
            fs.mkdirSync(imageDir, { recursive: true });
        }

        console.log(`Received request to update product with ID: ${prodId}`);
        console.log('Request Body:', productDetail);
        console.log("requested image",newImageFile)

        // Validate request body
        if (!productDetail || Object.keys(productDetail).length === 0) {
            return res.status(400).send('Product details are required');
        }

        // Fetch the existing product to get its current image path
        const existingProduct = await getProductById(prodId);
        if (!existingProduct) {
            return res.status(404).send('Product not found');
        }

        // Handle new image upload
        if (newImageFile) {
            const imageName = `${newImageFile.name}`;
            imagePath = `product-images/${imageName}`;
            const savePath = path.join(imageDir, imageName);

            console.log('the save path of imagdir and imgname',savePath)

            // Save the new image to the server
            await newImageFile.mv(savePath);
            console.log('Image uploaded and saved at:', imagePath);

            // Delete the old image if it exists
            const oldImagePath = path.join(__dirname, '..', 'public', existingProduct.image);
            if (fs.existsSync(oldImagePath)) {
                fs.unlinkSync(oldImagePath);
                console.log('Old image deleted:', existingProduct.image);
            }
        } else {
            // Retain the existing image path if no new image is uploaded
            imagePath = existingProduct.image;
        }

        // Prepare updated product details
        const updatedProductDetails = {
            productname: productDetail.productname,
            description: productDetail.description,
            price: parseFloat(productDetail.price),
            category: productDetail.category,
            image: imagePath,
        };

        // Update product in the database
        const response = await updateproduct(prodId, updatedProductDetails);
        console.log('Update product response:', response);

        if (response.success) {
            res.redirect('/admin'); // Redirect to products list after successful update
        } else {
            res.status(404).send(response.message);
        }
    } catch (error) {
        console.error('Error in updating product:', error);
        res.status(500).send('Internal server error');
    }
});
module.exports = router;