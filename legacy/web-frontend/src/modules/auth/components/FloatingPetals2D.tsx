/**
 * FloatingPetals2D: Cánh hoa anh đào vector 2D thuần túy
 * Trích xuất chuẩn xác từ tệp 05 - Auth - Sign In.svg và 06 - Auth - Create Account.svg
 * Không tiêu tốn tài nguyên GPU, không phụ thuộc WebGL Three.js
 */
export function FloatingPetals2D() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Cánh hoa 1: Góc trên bên trái (Sakura pink) */}
      <div className="absolute top-[82px] left-[64px] opacity-75 animate-bounce [animation-duration:6s]">
        <svg width="22" height="24" viewBox="56 82 22 24" fill="none">
          <path
            d="M64.9105 82.0384C65.4931 85.9109 69.9481 89.2007 69.0905 93.2355C68.2328 97.2704 63.9793 99.6463 61.2893 99.0745C58.5994 98.5028 55.68 94.6022 56.5376 90.5673C57.3952 86.5325 62.8032 85.3391 64.9105 82.0384V82.0384"
            fill="#FDCBD1"
          />
        </svg>
      </div>

      {/* Cánh hoa 2: Góc trên bên phải (Kitsune coral) */}
      <div className="absolute top-[115px] right-[58px] opacity-70 animate-pulse [animation-duration:4s]">
        <svg width="20" height="20" viewBox="331 115 20 20" fill="none">
          <path
            d="M331.692 115.694C334.609 117.02 338.851 115.429 341.238 117.815C343.624 120.202 343.359 124.179 341.768 125.77C340.177 127.361 336.2 127.626 333.813 125.24C331.427 122.853 333.018 118.611 331.692 115.694V115.694"
            fill="#F47F72"
            fillOpacity="0.7"
          />
        </svg>
      </div>

      {/* Cánh hoa 3: Giữa bên trái */}
      <div className="absolute top-[186px] left-[42px] opacity-60 animate-bounce [animation-duration:8s]">
        <svg width="18" height="18" viewBox="37 186 18 18" fill="none">
          <path
            d="M47.1276 186.872C46.0964 189.14 47.3338 192.44 45.4777 194.296C43.6215 196.153 40.5279 195.946 39.2905 194.709C38.0531 193.471 37.8468 190.378 39.703 188.522C41.5591 186.666 44.859 187.903 47.1276 186.872V186.872"
            fill="#EBBAC0"
          />
        </svg>
      </div>
    </div>
  )
}
