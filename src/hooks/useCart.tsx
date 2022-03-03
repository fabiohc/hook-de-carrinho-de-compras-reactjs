import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product, Stock } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart');
    
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  /*const prevCartRef = useRef<Product[]>();

  useEffect(() =>{

    prevCartRef
  })*/

  const addProduct = async (productId: number) => {
    try {
      const updateCart = [...cart];
      const productExist = updateCart.find(product => product.id === productId);

      const stock = await api.get(`/stock/${productId}`);

      const stockAmaunt = stock.data.amount;
      const currentAmaunt = productExist ? productExist.amount : 0;
      const amount = currentAmaunt + 1;
      if (amount > stockAmaunt) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }
      if (productExist) {
        productExist.amount = amount;
      } else {
        const product = await api.get(`/products/${productId}`);

        const newProduct = {
          ...product.data,
          amount: 1
        }
        updateCart.push(newProduct);
      }
      setCart(updateCart);
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(updateCart))

    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const itemsCart = [...cart]
      const indexItem = itemsCart.findIndex(item => item.id === productId)

      if (indexItem >= 0) {
        itemsCart.splice(indexItem, 1)
        setCart(itemsCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(itemsCart))
      } else {
        throw Error()
      }
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {

      if (amount <= 0) return;

      const stock = await api.get(`/stock/${productId}`);
      const totalStock = stock.data.amount;

      if (amount > totalStock) {
        toast.error('Quantidade solicitada fora de estoque');
        return;
      }

      const itemsCart = [...cart];

      const existeProduto = itemsCart.find(item => item.id === productId);
      if (existeProduto) {
        existeProduto.amount = amount;
        setCart(itemsCart);
        localStorage.setItem('@RocketShoes:cart', JSON.stringify(itemsCart))
      } else {
        throw Error()
      }

    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
