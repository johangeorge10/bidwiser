import React, { useState, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './Product.css';
import axios from 'axios';
import { useAuth } from './AuthContext';
import { useNavigate,Link } from 'react-router-dom';
import $ from 'jquery';
import 'jquery-countdown';


const ProductsPage = ({ darkMode, email,bidChange }) => {
  const [products, setProducts] = useState([]);
  const [bidAmount, setBidAmount] = useState(0);
  const [showBidModal, setShowBidModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [userBids, setUserBids] = useState([]); // New state to store user's bids
  const [modifyProductId, setModifyProductId] = useState(null);
  const [winningUsers, setWinningUsers] = useState({});
  const [productDetails, setProductDetails] = useState({});
  const [flag,setflag]=useState(0);
  const navigate = useNavigate();
  const [productImages, setProductImages] = useState({});

  

  
  
  // Use the userId from the context
  const auth = useAuth();
  const userId = auth.userId 

    // Fetch winning user details
    const fetchWinningUser = async (productId) => {
      try {
        const winningUserResponse = await axios.get(`http://127.0.0.1:5500/api/getWinningBid/${productId}`);
        setWinningUsers((prevWinningUsers) => ({
          ...prevWinningUsers,
          [productId]: winningUserResponse.data.winningBid.userId,
        }));
      } catch (error) {
        console.error('Error fetching winning user details:', error);
      }
    };


   
//update the timer of banner

useEffect(() => {
  const finalDate = '2024/04/10 00:00:00'; // Replace with your desired end date and time

  // Start the countdown timer
  $('#countdown').countdown(finalDate, function(event) {
    // Update the content of each count span with the corresponding value
    $('#days').text(event.strftime('%D'));
    $('#hours').text(event.strftime('%H'));
    $('#minutes').text(event.strftime('%M'));
    $('#seconds').text(event.strftime('%S'));
  });
}, []); // Run once when component mounts


useEffect(() => {
  const fetchProducts = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5500/api/getBids');
      setProducts(response.data.bids);

      const imagePromises = response.data.bids.map(async (product) => {
        const imageResponse = await axios.get(`http://127.0.0.1:5500/api/images/${product.imageUrl}`, {
          responseType: 'blob',
        });
        
        const reader = new FileReader();
        reader.readAsDataURL(imageResponse.data);
        reader.onloadend = () => {
          const imageData = reader.result;
          const imageUrl = imageData.toString();
          
          setProductImages((prevImages) => ({
            ...prevImages,
            [product._id]: imageUrl,
            
          }));
          
        };
      });

      await Promise.all(imagePromises);
    } catch (error) {
      console.error('Error fetching bids:', error);
    }
  };

  fetchProducts();
}, []);

const renderWinningUser = (productId) => {
  const winnerUserId = winningUsers[productId];
  return winnerUserId ? `Won By: ${winnerUserId}` : 'No Winner';
};
// Trigger recalculation when products change // Fetch user bids whenever userId changes  // The empty dependency array ensures that this effect runs only once when the component mounts

  useEffect(() => {
  
    // Call fetchWinningUser when selectedProduct changes
    if (selectedProduct) {
      fetchWinningUser(selectedProduct.productId);
    }
  }, [selectedProduct]);

  // Function to format date in "dd//mm/yyyy" format
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  
  const calculateRemainingTime = (endTime) => {
    const now = new Date();
    const end = new Date(endTime);
    const timeDiff = end - now;
  
    if (timeDiff <= 0) {
      return {
        ended: true,
        message: 'Bid has ended',
      };
    }
  
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
  
    const endDateFormatted = formatDate(endTime);
  
    return {
      ended: false,
      message: `Bid ends on: ${endDateFormatted}, ${hours}h ${minutes}m ${seconds}s left`,
    };
  };
  const handleChatClick = (productId) => {
    return () => {
      // Find the product associated with the productId
      const product = products.find((p) => p._id === productId);
  
      // Check if the product exists and if the bidding has ended
      if (!product || (product.endTime && new Date(product.endTime) < new Date())) {
        alert('Bidding for this product has already ended.');
        return;
      }
  
      // Check if the user is logged in
      if (!auth.loggedIn) {
        alert('Please log in to start a chat.');
        // Optionally, you can redirect to the login page
        navigate('/login');
        return;
      }
  
      // If the user is logged in and the bidding is active, navigate to the chat page
      navigate(`/chat/${productId}`);
    };
  };


  //pro-feedback
  // const goToProductFeedback = async(prodid) =>{
  //     window.location.href=`/ProductFeedback/${prodid}`;
  //     console.log("You are the winner of this product");
  // }

  //mail to winner of each product
  const sendEmailToWinner = async (productName, winningBid, productId) => {
    try {
        const response = await axios.post('http://127.0.0.1:5500/api/sendEmailToWinner', {
            productName,
            winningBid,
            productId
        });
        console.log('Email sent to winner:', response.data.message);
    } catch (error) {
        console.error('Error sending email to winner:', error);
    }
};


  const handleBid = async (productId, currentBid,startingBid) => {
    // Check if the user is logged in
    if (!auth.loggedIn) {
      alert('Please log in to place a bid.');
      // Optionally, you can redirect to the login page
      navigate('/login'); // Redirect to login page
      return;
    }

    // Fetch the product
  const product = products.find((p) => p._id === productId);

  if (!product) {
    alert('Product not found in the list');
    return;
  }

     // Check if bidding has ended
  if (product.endTime && new Date(product.endTime) < new Date()) {
    alert('Bidding for this product has already ended.');
    return;
  }
    setShowBidModal(true);
    setSelectedProduct({ productId, currentBid,startingBid });

   
  };

  const placeBid = async () => {
    if (!auth.loggedIn) {
      alert('Please log in to place a bid.');
      // Optionally, you can redirect to the login page
      navigate('/login');
      return;
    }
    
  
    console.log('Selected Product:', selectedProduct);
    console.log('Bid Amount:', bidAmount);
  
    if (!selectedProduct) {
      alert('Invalid product');
      return;
    }
  
    const product = products.find((p) => p._id === selectedProduct.productId);
  
    if (!product) {
      alert('Product not found in the list');
      return;
    }
  
    const startingBid = Number(product.startingBid);
  
    if (Number(bidAmount) <= startingBid) {
      alert(`Bid amount must be greater than the starting bid of ${startingBid}`);
      return;
    }
  
    try {
      const userId = auth.userId;
      // Use userId consistently
      if(userId===product.userId){
        alert(`You are the seller of ${product.name} you cannot place bid for your products`);
        return; 
      }
      
      if (Number(bidAmount) <= product.currentBid) {
        alert(`Bid amount must be greater than the current bid of ${product.currentBid}`);
        return;
      }

      if (!userId) {
        alert('User ID not found.');
        return;
      }
      //window.location.href="/product";

      const response = await axios.post('http://127.0.0.1:5500/api/placeBid', {
        productId: selectedProduct.productId,
        userId:userId,// Use userId consistently
        bidAmount: Number(bidAmount),
      });

      
      console.log('Place Bid Response:', response);
      

  
      if (response.status === 200) {
        // Fetch winning user details after placing a bid
        await fetchWinningUser(selectedProduct.productId);
  
        // Update the bid amount for the product in the state
        const updatedProducts = products.map((p) =>
          p._id === selectedProduct.productId ? { ...p, currentBid: Number(bidAmount) } : p
        );
        setProducts(updatedProducts); // Update product state with new bid amount
  
        // Fetch user bids after placing a bid
        const updatedUserBidsResponse = await axios.get(`http://127.0.0.1:5500/api/getUserBids/${userId}`);
        setUserBids(updatedUserBidsResponse.data.userBids);
  
        // Clear the bid modal
        setShowBidModal(false);
        setBidAmount('');
  
        // Optionally, you can force a re-render by toggling a state variable
        // This will ensure that the updated bid amount is immediately reflected in the UI
        setflag((prevFlag) => prevFlag + 1);
      } 
      else if(response.data.message === 'You are already the winning bidder'){
      alert(response.data.message);
      }
      else {
        alert('Failed to place bid', response.data);
      }  } 
  
  
  catch (error) {
    console.error('Error placing bid:', error);
    alert('You are currently the highest bidder');
  }
};
  
  const handleConfirmModifyBid = async (productId, newBid) => {
    try {
      const res = await axios.put(`http://127.0.0.1:5500/api/modifyBid/${productId}`, {
        newBid,
      });
  
      if (res.status === 200) {
        alert('Bid modified successfully');
        setProducts((prevProducts) =>
          prevProducts.map((product) =>
            product._id === productId ? { ...product, startingBid: parseInt(newBid) } : product
          )
        );
        setModifyProductId(null);
  
        // Fetch user bids after modifying a bid
        const updatedUserBidsResponse = await axios.get(`http://127.0.0.1:5500/api/getUserBids/${userId}`);
        setUserBids(updatedUserBidsResponse.data.userBids);
      } else {
        console.error('Failed to modify bid');
      }
    } catch (error) {
      console.error('Error modifying bid:', error);
      alert('An error occurred while modifying bid');
    }
  };
  
  
  
  const closeModal = () => {
    setShowBidModal(false);
    setSelectedProduct(null);
    setBidAmount('');
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);

  useEffect(() => {
    // Filter products based on search criteria
    const filtered = products.filter(
      (product) =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.startingBid.toString().includes(searchTerm) || // 
        product.currentBid.toString().includes(searchTerm) // 
        
    );
    setFilteredProducts(filtered);
  }, [products, searchTerm]);

   



  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };



  // Function to save bids data to local storage
  const saveBidsToLocalStorage = (bids) => {
    localStorage.setItem('bids', JSON.stringify(bids));
  };

  // Function to get bids data from local storage
  const getBidsFromLocalStorage = () => {
    const bids = localStorage.getItem('bids');
    return bids ? JSON.parse(bids) : [];
  };

  //sort expired
  const activeBidProducts = filteredProducts.filter((product) => !product.endTime || new Date(product.endTime) > new Date());
  const endedBidProducts = filteredProducts.filter((product) => product.endTime && new Date(product.endTime) <= new Date());

  // Sort active bid products based on remaining time
  activeBidProducts.sort((a, b) => {
    const remainingTimeA = calculateRemainingTime(a.endTime);
    const remainingTimeB = calculateRemainingTime(b.endTime);
    return remainingTimeA - remainingTimeB;
  });

  

  return (
    <div className={`products-page ${darkMode ? 'dark-mode' : ''}`}>
      <div className="container mt-5">
        {/* Search Bar */}
        <div className="mb-3">
          <input
            type="text"
            placeholder="Search by product name or bid : "
            className="form-control"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>


        {/* cart banner section */}
        {products.map((product, index) => (
        <section class="cart-banner pt-100 pb-100">
            <div class="container">
                <div class="row clearfix">
                    {/*Image Column*/}
                    <div class="image-column col-lg-6">
                        <div class="image">
                            <div class="price-box">
                                <div class="inner-price">
                                      <span class="price">
                                          <strong>Top!!</strong> <br/> Deal
                                      </span>
                                </div>
                            </div>
                            <div className='col-md-6'>
                            <img src={productImages[product._id]} alt={product.name} style={{ width: '200px', height: '200px' }} />   
                              {/* [selectedProduct.productId] ? productImages[selectedProduct.productId] : 'default-image-url'     */}
                            </div>
                        </div>
                    </div>
                      {/*Content Column*/}
                      <div class="content-column col-lg-6">
                        <h3><span class="orange-text">Deal</span> of the Day</h3>
                          <h4>Triumph</h4>
                          <div class="text">Quisquam minus maiores repudiandae nobis, minima saepe id, fugit ullam similique! Beatae, minima quisquam molestias facere ea. Perspiciatis unde omnis iste natus error sit voluptatem accusant</div>
                          {/*Countdown Timer*/}
                          <div className="time-counter">
                                <div className="time-countdown clearfix" data-countdown="" id="countdown">
                                  <div className="counter-column">
                                    <div className="inner">
                                      <span className="count" id="days">00</span>Days
                                    </div>
                                  </div>
                                  <div className="counter-column">
                                    <div className="inner">
                                      <span className="count" id="hours">00</span>Hours
                                    </div>
                                  </div>  
                                  <div className="counter-column">
                                    <div className="inner">
                                      <span className="count" id="minutes">00</span>Mins
                                    </div>
                                  </div>  
                                  <div className="counter-column">
                                    <div className="inner">
                                      <span className="count" id="seconds">00</span>Secs
                                    </div>
                                  </div>
                                </div>
                          </div>
                        <a href="cart.html" class="cart-btn mt-3"><i class="fas fa-shopping-cart"></i> Add to Cart</a>
                      </div>
                </div>
            </div>
          </section>
          ))}
          {/* end cart banner section */}

        <div style={{display:'block'}}>Live Auctions</div>
        <div className="row">
          {/* Display filtered products instead of all products */}
     
          {activeBidProducts.map((product) => (
       
            <div key={product._id} className="col-md-4 mb-4">
                  <div class='container-fluid'>
                      <div class="card mx-auto col-md-3 col-10 mt-5">
                      <img src={`http://127.0.0.1:5500/api/images/goodimage5,${productImages[product._id]}`} alt={product.name} style={{ width: '200px', height: '200px' }} /> 
                            <div class="card-body text-center mx-auto">
                                <div class='cvp'>
                                    <h5 class="card-title font-weight-bold">{product.name}</h5>
                                    <p class="card-text">Current Bid: &#8377;{product.currentBid}</p>
                                    <p className="card-text">{product.endTime &&
                                        (() => {
                                            const remainingTime = calculateRemainingTime(product.endTime);
                                            if (remainingTime.ended) {
                                              const winnerUserId = winningUsers[product._id];
                                              const winningBid = product.currentBid;

                                              if (!localStorage.getItem(`${product._id}_email_sent`)) { // Check if email has not been sent
                                                    sendEmailToWinner(product.name, winningBid, product._id);
                                                    localStorage.setItem(`${product._id}_email_sent`, 'true'); // Set flag in local storage
                                              }
                                        
                                              return `Bid has ended`;

                                            } else {
                                              return `${remainingTime.message}`;
                                            }
                                        })()
                                      }
                                  </p>
                                  <a href="#" class="btn details px-auto">View Details</a><br />
                                  <button className="btn-p cart px-auto" onClick={() => handleBid(product._id, product.currentBid, product.startingBid)}>
                                      Place Bid
                                  </button>
                                </div>
                            </div>
                      </div>
                  </div>
                  

              {/*<div className="card">
                
                 <div className="card-body"> 
                  <h5 className="card-text">Product Name : {product.name}</h5>
                  <p className="card-text">Product Description : {product.description}</p>
                  <p className="card-text">Product added by: {product.userId ? product.userId : 'Unknown'}</p>
                  <Link to={`/sellerinfo/${product.userId}`} className="card-text">Seller Info</Link>
                  <p className="card-text">Starting Bid: &#8377;{product.startingBid}</p>
                  <p className="card-text">Current Bid: &#8377;{product.currentBid}</p>
                  <p className="card-text">{product.endTime &&
                        (() => {
                            const remainingTime = calculateRemainingTime(product.endTime);
                            if (remainingTime.ended) {
                              const winnerUserId = winningUsers[product._id];
                              const winningBid = product.currentBid;

                              if (!localStorage.getItem(`${product._id}_email_sent`)) { // Check if email has not been sent
                                    sendEmailToWinner(product.name, winningBid, product._id);
                                    localStorage.setItem(`${product._id}_email_sent`, 'true'); // Set flag in local storage
                              }
                        
                              return `Bid has ended`;

                            } else {
                              return `Bid ends on: ${remainingTime.message}`;
                            }
                        })()
                      }
                  </p>
                  {/* Display highest bid and winning user after bid has ended */}{/*
                    {product.endTime && new Date(product.endTime) < new Date() && ( <>
                        
                        <p className="card-text">Highest Bid: &#8377;{product.currentBid}</p>
                        <p className="card-text">Bid Won By: {renderWinningUser(product._id)}</p>
                      </>
                    )}

                  
                  <button className="btn-primary2" onClick={() => handleBid(product._id, product.currentBid, product.startingBid)}>
                    Place Bid
                  </button>
                  &nbsp;
                  <button className="chat-btn" onClick={handleChatClick(product._id)}>
                    Chat
                  </button>
                  &nbsp;
                  {/* Render feedback button only if bid has ended and current user is the winner */}{/*
                  {product.endTime && new Date(product.endTime) < new Date() && winningUsers[product._id] === auth.userId && (
                  <button className="feedback-btn" onClick={() => goToProductFeedback(product._id)}>
                  Product Feedback
                  </button>
                  )} */}
{/* 
                </div>
              </div>  */}
            </div>
          ))}
        </div>
          <div style={{display:'block'}}>Bid ended</div>


        {/* bidended */}
        <div className="row">
          {/* Display filtered products instead of all products */}
          {endedBidProducts.map((product) => (
       
            <div key={product._id} className="col-md-4 mb-4">
                  <div class='container-fluid'>
                      <div class="card mx-auto col-md-3 col-10 mt-5">
                            <img class='mx-auto img-thumbnail'
                                src="https://wallpapercave.com/wp/wp8257248.jpg"
                                width="auto" height="auto"/>
                            <div class="card-body text-center mx-auto">
                                <div class='cvp'>
                                    <h5 class="card-title font-weight-bold">{product.name}</h5>
                                    <p class="card-text">Current Bid: &#8377;{product.currentBid}</p>
                                    <p className="card-text">{product.endTime &&
                                        (() => {
                                            const remainingTime = calculateRemainingTime(product.endTime);
                                            if (remainingTime.ended) {
                                              const winnerUserId = winningUsers[product._id];
                                              const winningBid = product.currentBid;

                                              if (!localStorage.getItem(`${product._id}_email_sent`)) { // Check if email has not been sent
                                                    sendEmailToWinner(product.name, winningBid, product._id);
                                                    localStorage.setItem(`${product._id}_email_sent`, 'true'); // Set flag in local storage
                                              }
                                        
                                              return `Bid has ended`;

                                            } else {
                                              return `${remainingTime.message}`;
                                            }
                                        })()
                                      }
                                  </p>
                                  <a href="#" class="btn details px-auto">View Details</a><br />
                                  {/* <button className="btn-p cart px-auto" onClick={() => handleBid(product._id, product.currentBid, product.startingBid)}>
                                      Place Bid
                                  </button> */}
                                </div>
                            </div>
                      </div>
                  </div>
                  

              {/*<div className="card">
                
                 <div className="card-body"> 
                  <h5 className="card-text">Product Name : {product.name}</h5>
                  <p className="card-text">Product Description : {product.description}</p>
                  <p className="card-text">Product added by: {product.userId ? product.userId : 'Unknown'}</p>
                  <Link to={`/sellerinfo/${product.userId}`} className="card-text">Seller Info</Link>
                  <p className="card-text">Starting Bid: &#8377;{product.startingBid}</p>
                  <p className="card-text">Current Bid: &#8377;{product.currentBid}</p>
                  <p className="card-text">{product.endTime &&
                        (() => {
                            const remainingTime = calculateRemainingTime(product.endTime);
                            if (remainingTime.ended) {
                              const winnerUserId = winningUsers[product._id];
                              const winningBid = product.currentBid;

                              if (!localStorage.getItem(`${product._id}_email_sent`)) { // Check if email has not been sent
                                    sendEmailToWinner(product.name, winningBid, product._id);
                                    localStorage.setItem(`${product._id}_email_sent`, 'true'); // Set flag in local storage
                              }
                        
                              return `Bid has ended`;

                            } else {
                              return `Bid ends on: ${remainingTime.message}`;
                            }
                        })()
                      }
                  </p>
                  {/* Display highest bid and winning user after bid has ended */}{/*
                    {product.endTime && new Date(product.endTime) < new Date() && ( <>
                        
                        <p className="card-text">Highest Bid: &#8377;{product.currentBid}</p>
                        <p className="card-text">Bid Won By: {renderWinningUser(product._id)}</p>
                      </>
                    )}

                  
                  <button className="btn-primary2" onClick={() => handleBid(product._id, product.currentBid, product.startingBid)}>
                    Place Bid
                  </button>
                  &nbsp;
                  <button className="chat-btn" onClick={handleChatClick(product._id)}>
                    Chat
                  </button>
                  &nbsp;
                  {/* Render feedback button only if bid has ended and current user is the winner */}{/*
                  {product.endTime && new Date(product.endTime) < new Date() && winningUsers[product._id] === auth.userId && (
                  <button className="feedback-btn" onClick={() => goToProductFeedback(product._id)}>
                  Product Feedback
                  </button>
                  )} */}
{/* 
                </div>
              </div>  */}
            </div>
          ))}
        </div>


      </div>

      {showBidModal && (
        <div className="modal" style={{ display: 'block' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h2 className="modal-title">Place Bid</h2>
                <button type="button" className="btn-close" onClick={closeModal}>
                </button>
              </div>
              <div className="modal-body">
                <p>Current Bid: &#8377;{selectedProduct.currentBid}</p>
              
                <p style={{display:"none"}}>{ bidAmount==0 && flag==0 ?(setBidAmount(selectedProduct.currentBid+10),showBidModal&&setflag(1)):showBidModal&&bidAmount}</p>
                 <input type="number"
                  placeholder="Enter your bid amount"
                  className="form-control1"
                  value={bidAmount}
                  onChange={(e) => setBidAmount(e.target.value)}
                />
              </div>
              <div className="modal-footer">
                <button className="btn-primary2" onClick={placeBid}>
                  Place Bid
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 

export default ProductsPage; 