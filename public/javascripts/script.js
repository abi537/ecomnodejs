function addtocart(proid){
    $.ajax({
      url:'/add-to-cart/'+proid,
      method:'get',
      success:(response)=>{
        console.log("theresponseeeee",response.status)
        if(response.status){
        let count=$('#cart-count').html()
       
        console.log('debuuggggg1',count)
        

        count=parseInt(count)+1
        console.log('debuuggggg2',count)
        $('#cart-count').html(count)
        }
        //alert(response)
      }
    })
  }