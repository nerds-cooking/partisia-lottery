import PartisiaSdk from 'partisia-blockchain-applications-sdk';
import React, {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from 'react';
import { useSettings } from '../setting/useSettings';

export interface PartisiaProviderProps {
  children: React.ReactNode;
}

export interface PartisiaContextType {
  sdk: PartisiaSdk | null;
  connect: () => Promise<void>;
  isConnected: boolean;
}

export const PartisiaContext = createContext<PartisiaContextType | undefined>(
  undefined
);

export const PartisiaProvider = ({ children }: PartisiaProviderProps) => {
  const [sdk, setSdk] = useState<PartisiaSdk | null>(null);
  const { settings } = useSettings();

  const network = useMemo(() => {
    return settings?.find((s) => s.name === 'network')?.value || 'testnet';
  }, [settings]);

  const connect = useCallback(
    async (networkArg?: 'mainnet' | 'testnet') => {
      const _sdk = new PartisiaSdk();

      try {
        await _sdk.connect({
          permissions: ['sign'] as never,
          dappName: 'NC Partisia Trivia',
          chainId:
            (networkArg || network) === 'mainnet'
              ? 'Partisia Blockchain'
              : 'Partisia Blockchain Testnet'
        });

        console.log('connected!');

        // Save connection to local storage
        localStorage.setItem(
          'partisia',
          JSON.stringify({ connection: _sdk.connection, seed: _sdk.seed })
        );

        setSdk(_sdk);
      } catch (err) {
        console.error('Failed to connect to Partisia SDK:', err);
      }
    },
    [network]
  );

  const isConnected = !!(sdk && sdk.connection && sdk.connection.account);

  useEffect(() => {
    const timeout = setTimeout(() => {
      // Check if there's a saved connection in local storage
      try {
        const savedPartisia = localStorage.getItem('partisia');
        if (savedPartisia) {
          const { connection, seed } = JSON.parse(savedPartisia);
          const instance = new PartisiaSdk({ seed, connection });
          setSdk(instance);
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }, 100);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  return (
    <PartisiaContext.Provider
      value={{
        sdk,
        connect,
        isConnected
      }}
    >
      {children}
    </PartisiaContext.Provider>
  );
};
