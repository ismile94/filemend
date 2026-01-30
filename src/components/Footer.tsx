import { FileText, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-1.5 bg-primary rounded-lg">
                <FileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">FileTools</span>
            </div>
            <p className="text-sm text-muted-foreground">
              PDF, ses ve görüntü dosyalarınızı tarayıcınızda güvenle işleyin. 
              Dosyalarınız asla sunucularımıza yüklenmez.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Hızlı Bağlantılar</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/pdf/merge" className="text-muted-foreground hover:text-foreground transition-colors">
                  PDF Birleştir
                </a>
              </li>
              <li>
                <a href="/audio/convert" className="text-muted-foreground hover:text-foreground transition-colors">
                  Ses Dönüştür
                </a>
              </li>
              <li>
                <a href="/image/compress" className="text-muted-foreground hover:text-foreground transition-colors">
                  Görüntü Sıkıştır
                </a>
              </li>
            </ul>
          </div>

          {/* Features */}
          <div>
            <h4 className="font-semibold mb-4">Özellikler</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                %100 Tarayıcıda İşleme
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Gizlilik Odaklı
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Ücretsiz Kullanım
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Mobil Uyumlu
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 FileTools. Tüm hakları saklıdır.
          </p>
          <p className="text-sm text-muted-foreground flex items-center gap-1">
            Made with <Heart className="w-4 h-4 text-red-500 fill-red-500" /> for you
          </p>
        </div>
      </div>
    </footer>
  );
};
