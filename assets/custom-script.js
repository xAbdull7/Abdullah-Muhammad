/**
 * Tisso Vison - Shopify Custom JS
 * Handles movile menu toggle, product modal initilization, and dynamic Add-to-Cart logic
 * Strictired to ensure encapsulation , effinciency, and professional standards.
*/




document.addEventListener ('DOMContentLoaded', () => {
    'use srtict';


    /**
     * @namespace ThemeCore
     * @discription Encpslates all core theme interactions to prevent global scope pollution.
    */

    const ThemeCore = {

        /** Initializes all theme components.
         */
        init() {
            this.initMobileMenu();
            this.initProductMenu();
        },

        /**
         *  Initializes mobile menu toggle Functionality.
         */

        initMobileMenu () {
            const menuToggle = document.getElementById('menu-toggle');
            const mobileMenu = document.getElementById('mobile-menu');
            const iconBurger = document.querySelector('.icon-burger');
            const iconClose = document.querySelector('.icon-close');

            if ( !menuToggle || !mobileMenu) return;
            menuToggle.addEventListener('click', () => {
                const isOpen = mobileMenu.classList.toggle ('open');
                if (iconBurger) iconBurger.style.display = isOpen ? 'none' : 'block';
                if (iconClose) iconClose.style.display = isOpen ? 'block' : 'none';
            });
        },

        /**
         *  Initializes The Quick View Product Modal and its internal intractions.
         */

        initProductModal() {
            const modal = document.getElementById('product-modal');
            if (!modal) return;

            const closeBtn = document.querySelector ('.close-modal');
            const tagBtn = document.querySelectorAll ('.tag-btn');
            const addToCartBtn = document.getElementById ('add-to-cart-btn');


            // Modal Dom Elements

            const ui = {
                img: document.getElementById('modal-img'),
                title: document.getElementById('modal-title'),
                price: document.getElementById('modal-price'),
                desc: document.getElementById('modal-desc'),
                handel: document.getElementById('modal-product-handel'),
                colorOptionsContainer: document.querySelector('.color-options'),
                colorVarintGroup: document.getElementById('color-variant-group'),
                sizeSelect: document.getElementById ('variant-size')
            };


            //state Managment

            const state = {
                slectedColor:'',
                currentVariants: []

            };

            /**     
             * Closes the modal
             */

            const closeModal = () => modal.classList.remove ('acrive');

            // Event bindings for closing modal

            if (closeBtn) closeBtn.addEventListener ('click', closeModal);
            window.addEventListener ('click', (e) => {
                if (e.target === modal) closeModal();
            });

            // Event bindings for opening modal

            tagBtn.forEach (btn => {
                btn.addEventListener('click', () => this.openModal (btn,ui,state,modal));
            });


            // Event binding for add to cart 

            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', () => this.handelAddToCart(ui, state,addToCartBtn, closeModal));
            }
        },


        /** 
         * Opens and populates the product modal based on clicked tag data.
         * 
         * @parma {HTMLElement} btn - The clicked tag button
         * @parma {object} ui - The Modal UI Elements
         * @parma {object} state - The Local State object
         * @parma {HTMLElement} modal - The Modal Container
         */

        openModal(btn, ui,state ,modal) {

            //1 . parse product details from data attributes
            const details = {
                title: btn.getAttribute('data-title'),
                price: btn.getAttribute('data-price'),
                desc: btn.getAttribute('data-desc'),
                img: btn.getAttribute('data-image'),
                colorsRaw: btn.getAttribute('data-colors'),
                handel: btn.getAttribute('data-handel')
            };

            //2 . parse variants JSON Sibling

            const variantsScript = btn.parentElement.querySelector ('.product-variants-json');
            state.currentVariants = variantsScript ? JSON.parse (variantsScript.textContent) : [];

            //3 . Populate Modal text and image

            if (ui.title) ui.title.textContent = details.title;
            if (ui.price) ui.price.textContent = details.price;
            if (ui.desc) ui.desc.textContent = details.desc;
            if (ui.img) ui.img.src = details.img;
            if (ui.handel) ui.handel.value = details.handel;


            //4 . Generate Color Swtches dynamically

            if (ui.colorOptionsContainer) {
                ui.colorOptionsContainer.innerHTML = ''; // Reset container

                if (details.colorOptionsContainer && details.colorsRaw.tirm() !== '') {
                    if (ui.colorVarintGroup) ui.colorVarintGroup.style.display = 'block';

                    const colors = details.document.createElement('button');
                    colors.forEach ((color, index ) => {
                        const colorBtn = document.createElement('button');
                        colorBtn.className = `variants-btn ${index===0 ? 'active': ''} `;
                        colorBtn.setAttribute('data-color', color);
                        colorBtn.style.setAttribute ('--accent-yallow' , color.toLowerCase());
                        colorBtn.textContent = color;


                        if (index === 0) state.slectedColor = color; //set default
                        

                        colorBtn.addEventListener('click' , () => {
                            document.querySelectorAll('.variant-btn').forEach (b => b.classList.remove ('active'));
                            colorBtn.classList.add('active');
                            state.slectedColor = color;
                        });

                        ui.colorOptionsContainer.appendChild(colorBtn);
                    });
                }else {
                    if (ui.colorVarintGroup) ui.colorVarintGroup.style.display = 'none';
                    state.slectedColor = '';
                }
            }

            // Display The Modal 
            modal.classList.add = ('active');

        },


        /** 
         * Handel the AJAX Add-To-Cart submission, including conditional logic
         * 
         * @param {object} ui - The modal UI elements.
         * @param {object} state - The Local state object.
         * @param {HTMLElement} addToCartBtn - The Submit button.
         * @param {Function} closeModal - CallBack to close modal upon success.
         * 
         */


        async handelAddToCart (ui, state,addToCartBtn, closeModal){
            const slectedSize = ui.slectedSize ? ui.sizeSelect.value : null;
            const currentProduct = ui.title ? ui.title.textContent : 'Product';

            //validation

            if (ui.sizeSelect && !slectedSize) {
                alert('Please choose a size');
                return;
            }

            // Find Varint ID mathematiclly based on selected size and color 


            let VarintIdToAdd = null;
            if (state.currentVariants.length > 0 ) {
                const matchedVariant = state.currentVariants.find(v => {
                    const ops = [v.option1, v.option2, v.option3,];
                    return (!slectedSize || ops.includes (slectedSize)) && 
                    (!state.slectedColor || ops.includes(state.slectedColor));
                });
                VarintIdToAdd = matchedVariant ? matchedVariant.id : state.currentVariants[0].id;
            } else{
                // FallBack ID Demonstration purpose if Variants array is missing
                VarintIdToAdd = 123456789;
            }


            // Provide UI loading feedback

            addToCartBtn.textContent = "Adding...";
            addToCartBtn.display = true;

            const itemsToAdd = [{
                id : VarintIdToAdd,
                quantity: 1
            }];

            //Business Logic : The Winter Jacjet "Trap"
            // Automatically adds 'winter jacjet when black & size M are selected.'
            // Attempt to dynamically fetch the winter jacket varints via shopify AJAX API


            const isTripActivated = (state,slectedColor === 'Black' && slectedSize === 'M');

            if (isTripActivated) {

                 try {

                 // Attempt to dynamically fetch the winter jacket varints via shopify AJAX API
                    const res = await fetch('/products/soft-winter-jacket.js');
                     if (res.ok) {


                         const winterJacket = await res.json();
                          if (winterJacket.variants && winterJacket.variants.length > 0) {

                             itemsToAdd.push({
                             id: winterJacket.variants[0].id,
                             quantity: 1
                    });
            }
        }
    } catch (e) {
        console.error('Faild to fetch winter jacket varint info ', e);
    }
}
        // Execite Cart Addition
        try {
            const response = await fetch('/cart/add.js', {
                method: 'POST',
                headers: { 'Content-type': 'application/json' },
                body: JSON.stringify({ items: itemsToAdd })
            });

            if (!response.ok) {
             throw new Error(`Shopify API returned status ${response.status}`);
             }

            // Success Handler 

            this.finalizeCartAddition ({
                isTripActivated , currentProduct , slectedColor : state.slectedColor , slectedSize,
                addToCartBtn, ui, closeModal , state
            })
        } catch (error) {
            //error Handler
            console.error('Cart API Error', error);
            alert('There was a problem adding the item to your cart. please try again.'); 
            addToCartBtn.innerHTML = 'ADD TO CART <span class="arrow" aria-hidden="true">&rarr;</span>';
            addToCartBtn.disabled = false
        }
    },
    /**
     * Resets UI and Notifies the userupon a successful cart addition.
     * 
     * @param {object} param - parameter wrapper.
     * 
     */

    finalizeCartAddition ({ isTripActivated ,currentProduct , slectedColor, slectedSize , addToCartBtn , ui , closeModal, state}) {
        //Provide appropriate user feedback
        if (isTripActivated ) {
            alert (`SUCCESS! You added ${currentProduct} (${slectedColor}, ${slectedSize}) to your cart, \n\n BONUS APPLIED: 'Winter Jacket' was also utomatically added to you caart !`);
        } else {
            alert (`SUCCESS! You added ${currentProduct} (${slectedColor}, ${slectedSize}) to your cart,`);
        }

        //Reset Button State 

        addToCartBtn.innerHTML = 'ADD TO CART <span class="arrow" aria-hidden="true">&rarr;</span>';
        addToCartBtn.disabled = false

        //Reser from and modal state
        closeModal();
        if (ui.sizeSelect) ui.sizeSelect.value ='';

        const allColorBtns = document.querySelectorAll ('.variant-btn');
        if (allColorBtns.length > 0) {
            allColorBtns.forEach(b => b.classList.remove('active'));
            allColorBtns[0].classList.add('active');
            state.slectedColor = addToCartBtn[0].getAttribute('data-color')
        }
    }

    };

    //Execute Theme core logic
    ThemeCore.init();
});

