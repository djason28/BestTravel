package main
import (
"fmt"
"os"
"github.com/joho/godotenv"
)
func main() {
if err := godotenv.Overload("../.env"); err != nil { fmt.Println("overload err", err) }
fmt.Println("DB_USER:", os.Getenv("DB_USER"))
}
