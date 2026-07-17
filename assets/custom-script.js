/**
 * Tisso Vison - Shopify Custom JS
 * Handles mobile menu toggle, product modal initialization, and dynamic Add-to-Cart logic
 * Structured to ensure encapsulation, efficiency, and professional standards.
*/

document.addEventListener ('DOMContentLoaded', () => {
    'use strict';

    /**
     * @namespace ThemeCore
     * @description Encapsulates all core theme interactions to prevent global scope pollution.
    */

    const ThemeCore = {

        /** Initializes all theme components.
         */
        init() {
            this.initMobileMenu();
            this.initProductModal(); // fixed spelling
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
         *  Initializes The Quick View Product Modal and its internal interactions.
         */

        initProductModal() {
            const modal = document.getElementById('product-modal');
            if (!modal) return;

            const closeBtn = document.querySelector('.close-modal');
            const tagBtns = document.querySelectorAll('.tag-btn');
            const addToCartBtn = document.getElementById('add-to-cart'); // fixed id matching html

            // Modal Dom Elements

            const ui = {
                img: document.getElementById('modal-img'),
                title: document.getElementById('modal-title'),
                price: document.getElementById('modal-price'),
                desc: document.getElementById('modal-desc'),
                handle: document.getElementById('modal-product-handle'),
                colorOptionsContainer: document.querySelector('.color-options'),
                colorVariantGroup: document.getElementById('color-variant-group'), // fixed spelling
                sizeSelect: document.getElementById('variant-size')
            };

            //state Management

            const state = {
                selectedColor:'', // fixed spelling
                currentVariants: [],
                fallbackVariantId: null
            };

            /**     
             * Closes the modal
             */

            const closeModal = () => modal.classList.remove('active'); // fixed typo

            // Event bindings for closing modal

            if (closeBtn) closeBtn.addEventListener('click', closeModal);
            window.addEventListener('click', (e) => {
                if (e.target === modal) closeModal();
            });

            // Event bindings for opening modal

            tagBtns.forEach(btn => {
                btn.addEventListener('click', () => this.openModal(btn, ui, state, modal));
            });


            // Event binding for add to cart 

            if (addToCartBtn) {
                addToCartBtn.addEventListener('click', () => this.handleAddToCart(ui, state, addToCartBtn, closeModal)); // fixed spelling
            }
        },


        /** 
         * Opens and populates the product modal based on clicked tag data.
         * 
         * @param {HTMLElement} btn - The clicked tag button
         * @param {object} ui - The Modal UI Elements
         * @param {object} state - The Local State object
         * @param {HTMLElement} modal - The Modal Container
         */

        openModal(btn, ui, state, modal) {

            //1 . parse product details from data attributes
            const details = {
                title: btn.getAttribute('data-title'),
                price: btn.getAttribute('data-price'),
                desc: btn.getAttribute('data-desc'),
                img: btn.getAttribute('data-image'),
                colorsRaw: btn.getAttribute('data-color'), // fixed from 'data-colors' to 'data-color'
                handle: btn.getAttribute('data-handle'), // fixed from 'data-handel'
                variantId: btn.getAttribute('data-variant-id') // user asked for variant id logic
            };

            state.fallbackVariantId = details.variantId;

            //2 . parse variants JSON Sibling

            const variantsScript = btn.parentElement.querySelector('.product-variants-json');
            state.currentVariants = variantsScript ? JSON.parse(variantsScript.textContent) : [];

            //3 . Populate Modal text and image

            if (ui.title) ui.title.textContent = details.title;
            if (ui.price) ui.price.textContent = details.price;
            if (ui.desc) ui.desc.textContent = details.desc;
            if (ui.img) ui.img.src = details.img;
            if (ui.handle) ui.handle.value = details.handle;


            //4 . Generate Color Switches dynamically

            if (ui.colorOptionsContainer) {
                ui.colorOptionsContainer.innerHTML = ''; // Reset container

                if (details.colorsRaw && details.colorsRaw.trim() !== '') {
                    if (ui.colorVariantGroup) ui.colorVariantGroup.style.display = 'block';

                    const colors = details.colorsRaw.split(','); // Fixed logic, previously was document.createElement
                    colors.forEach((color, index) => {
                        const colorBtn = document.createElement('button');
                        colorBtn.className = `variant-btn ${index===0 ? 'active': ''} `;
                        colorBtn.setAttribute('data-color', color.trim());
                        colorBtn.style.setProperty('--accent-yellow', color.trim().toLowerCase()); // Fixed setAttribute -> setProperty
                        colorBtn.textContent = color.trim();


                        if (index === 0) state.selectedColor = color.trim(); //set default
                        

                        colorBtn.addEventListener('click', () => {
                            document.querySelectorAll('.variant-btn').forEach(b => b.classList.remove('active'));
                            colorBtn.classList.add('active');
                            state.selectedColor = color.trim();
                        });

                        ui.colorOptionsContainer.appendChild(colorBtn);
                    });
                } else {
                    if (ui.colorVariantGroup) ui.colorVariantGroup.style.display = 'none';
                    state.selectedColor = '';
                }
            }

            // Display The Modal 
            modal.classList.add('active');

        },


        /** 
         * Handle the AJAX Add-To-Cart submission, including conditional logic
         * 
         * @param {object} ui - The modal UI elements.
         * @param {object} state - The Local state object.
         * @param {HTMLElement} addToCartBtn - The Submit button.
         * @param {Function} closeModal - CallBack to close modal upon success.
         * 
         */


        async handleAddToCart(ui, state, addToCartBtn, closeModal) {
            const selectedSize = ui.sizeSelect ? ui.sizeSelect.value : null;
            const currentProduct = ui.title ? ui.title.textContent : 'Product';

            //validation

            if (ui.sizeSelect && (!selectedSize || selectedSize === 'disabled selected')) {
                alert('Please choose a size');
                return;
            }

            // Find Variant ID mathematically based on selected size and color 


            let variantIdToAdd = null;
            if (state.currentVariants.length > 0) {
                const matchedVariant = state.currentVariants.find(v => {
                    const ops = [v.option1, v.option2, v.option3];
                    return (!selectedSize || ops.includes(selectedSize)) && 
                           (!state.selectedColor || ops.includes(state.selectedColor));
                });
                variantIdToAdd = matchedVariant ? matchedVariant.id : state.currentVariants[0].id;
            } else {
                // FallBack ID Demonstration purpose if Variants array is missing
                variantIdToAdd = state.fallbackVariantId || 123456789;
            }


            // Provide UI loading feedback

            addToCartBtn.textContent = "Adding...";
            addToCartBtn.disabled = true; // fixed display = true

            const itemsToAdd = [{
                id: variantIdToAdd,
                quantity: 1
            }];

            //Business Logic : The Winter Jacket "Trap"
            // Automatically adds 'winter jacket when black & size M are selected.'
            // Attempt to dynamically fetch the winter jacket variants via shopify AJAX API


            const isTrapActivated = (state.selectedColor === 'Black' && selectedSize === 'M'); // fixed logic

            if (isTrapActivated) {
                 try {
                 // Attempt to dynamically fetch the winter jacket variants via shopify AJAX API
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
                     console.error('Failed to fetch winter jacket variant info ', e);
                 }
            }

            // Execute Cart Addition
            try {
                const response = await fetch('/cart/add.js', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ items: itemsToAdd })
                });

                if (!response.ok) {
                    throw new Error(`Shopify API returned status ${response.status}`);
                }

                // Success Handler 

                this.finalizeCartAddition({
                    isTrapActivated, currentProduct, selectedColor: state.selectedColor, selectedSize,
                    addToCartBtn, ui, closeModal, state
                });
            } catch (error) {
                //error Handler
                console.error('Cart API Error', error);
                alert('There was a problem adding the item to your cart. please try again.'); 
                addToCartBtn.innerHTML = 'ADD TO CART <span class="arrow" aria-hidden="true">&rarr;</span>';
                addToCartBtn.disabled = false;
            }
        },

        /**
         * Resets UI and Notifies the user upon a successful cart addition.
         * 
         * @param {object} param - parameter wrapper.
         * 
         */

        finalizeCartAddition({ isTrapActivated, currentProduct, selectedColor, selectedSize, addToCartBtn, ui, closeModal, state}) {
            //Provide appropriate user feedback
            if (isTrapActivated) {
                alert(`SUCCESS! You added ${currentProduct} (${selectedColor}, ${selectedSize}) to your cart, \n\n BONUS APPLIED: 'Winter Jacket' was also automatically added to your cart !`);
            } else {
                alert(`SUCCESS! You added ${currentProduct} (${selectedColor}, ${selectedSize}) to your cart.`);
            }

            //Reset Button State 

            addToCartBtn.innerHTML = 'ADD TO CART <span class="arrow" aria-hidden="true">&rarr;</span>';
            addToCartBtn.disabled = false;

            //Reset form and modal state
            closeModal();
            if (ui.sizeSelect) ui.sizeSelect.value = 'disabled selected';

            const allColorBtns = document.querySelectorAll('.variant-btn');
            if (allColorBtns.length > 0) {
                allColorBtns.forEach(b => b.classList.remove('active'));
                allColorBtns[0].classList.add('active');
                state.selectedColor = allColorBtns[0].getAttribute('data-color');
            }
        }

    };

    //Execute Theme core logic
    ThemeCore.init();
});
