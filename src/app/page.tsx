import { TimeMetricsChart } from "@/components/landing/time-metrics-chart";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronRight, PhoneIcon, Pyramid } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { EnvelopeClosedIcon, EnvelopeOpenIcon } from "@radix-ui/react-icons";

export default function LandingPage() {
  return (
    <div>
      <header className="sticky top-0 w-full h-16 flex flex-row items-center justify-between px-10 border-b bg-white">
        <nav className="flex flex-row items-center">
          <Pyramid className="w-[1.8rem] h-[1.8rem] mr-2" />
          <Link href="/">
            <Button variant="link">Главная</Button>
          </Link>
          <Link href="http://localhost:3000/#key-features">
            <Button variant="link">Ключевые особенности</Button>
          </Link>
          <Link href="http://localhost:3000/#testimonials">
            <Button variant="link">Отзывы военнослужащих</Button>
          </Link>
        </nav>
        <div className="flex flex-row items-center gap-4">
          <Link href="/auth/sign-in">
            <Button variant="outline">Войти</Button>
          </Link>
          <Link href="/auth/sign-up">
            <Button className="flex flex-row items-center gap-2">
              Регистрация
            </Button>
          </Link>
        </div>
      </header>

      <main className="flex flex-col">
        <section className="py-40 w-full flex flex-row gap-6 items-center justify-around">
          <div className="flex flex-col gap-6">
            <h1 className="text-6xl font-black max-w-[600px]">
              Новый способ тестирования военнослужащих
            </h1>
            <p className="text-md text-muted-foreground font-medium tracking-wide max-w-[600px]">
              Создавайте анкеты, тестовые методики. Управляйте результатами и
              списками личного состава. Откройте для себя новый опыт
              тестирования и анкетирования военнослужащих
            </p>
            <Link href="/auth/sign-up">
              <Button size="lg" className="flex flex-row items-center gap-2">
                Начать пользоваться
                <ChevronRight className="w-[1.2rem] h-[1.2rem]" />
              </Button>
            </Link>
          </div>
          <Image
            width={640}
            height={320}
            src="/hero-section.jpg"
            alt="chevron"
            className="rounded-xl"
          />
        </section>

        <section id="key-features" className="w-full py-6 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Ключевые особенности
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Облегчите процесс обработки результатов
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Наше приложение предоставляет удобный интерфейс для создания и
                  обработки тестовых методик. Результаты тестовых методик
                  автоматически обрабатываются и сохраняются в базу данных
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">Актуальность</h3>
                      <p className="text-muted-foreground">
                        Призма была разработана для замены тестирования с
                        помощью бумажных носителей. Она помогает ускорить
                        процесс обработки, создания методик в разы
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">Безопасность</h3>
                      <p className="text-muted-foreground">
                        Призма хранит данные в зашифрованном виде внутри
                        файловой системы компьютера, тем самым обеспечивает их
                        100% безопасность
                      </p>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">Удобный интерфейс</h3>
                      <p className="text-muted-foreground">
                        Мы предоставляем удобный пользовательский интерфейс для
                        создания, редактирования анкет, тестовых методик,
                        обработки результатов и, непосредственно, самого
                        тестирования
                      </p>
                    </div>
                  </li>
                </ul>
              </div>
              <TimeMetricsChart />
            </div>
          </div>
        </section>

        <section id="testimonials" className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Отзывы военнослужащих
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Что говорят наши военнослужащие
                </h2>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  Узнайте мнение солдат, которые получили ранний доступ к нашему
                  приложению
                </p>
              </div>
            </div>
            <div className="mx-auto grid max-w-7xl grid-cols-1 gap-6 py-12 sm:grid-cols-2 md:grid-cols-3 lg:gap-8">
              <Card>
                <CardContent className="py-4 flex flex-col gap-6">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="/user-3.jpg" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold">Станкевич Сергей</p>
                      <p className="text-sm text-muted-foreground">
                        Ефрейтор, ИДМБ
                      </p>
                    </div>
                  </div>
                  <blockquote className="text-muted-foreground">
                    Я предпочитаю проходить тесты и заполнять анкеты в этом
                    приложении, по-скольку это не так выматывает, как
                    традиционное тестирование на бумажных носителях
                  </blockquote>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex flex-col gap-6">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="/user-2.jpg" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold">
                        Черёмухин Александр
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Сержант, ИТБ
                      </p>
                    </div>
                  </div>
                  <blockquote className="text-muted-foreground">
                    Очень приятный интерфейс, не думал что проходить
                    психологические тесты будет так приятно и легко.
                  </blockquote>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="py-4 flex flex-col gap-6">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarImage src="/user-1.jpg" />
                      <AvatarFallback>JD</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-lg font-semibold">Маслиевич Дмитрий</p>
                      <p className="text-sm text-muted-foreground">
                        Майор, ИДМБ
                      </p>
                    </div>
                  </div>
                  <blockquote className="text-muted-foreground">
                    Особое внимание в данной программе привлекает возможность
                    использования в отрыве от ППД, а так же в отсутствие
                    психолога
                  </blockquote>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="key-features" className="w-full py-6 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
                  Актуальность применения
                </div>
                <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">
                  Актуальность применения нашего продукта
                </h2>
              </div>
            </div>
            <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <ul className="grid gap-6">
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">
                        1. Эффективность диагностики
                      </h3>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">
                        2. Доступность данных
                      </h3>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">
                        3. Интеграция с другими областями
                      </h3>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">
                        4. Скорость и эффективность
                      </h3>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">
                        5. Минимизация ошибок
                      </h3>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">
                        6. Доступность и удобство
                      </h3>
                    </div>
                  </li>
                  <li>
                    <div className="grid gap-1">
                      <h3 className="text-xl font-bold">
                        7. Гибкость и адаптивность
                      </h3>
                    </div>
                  </li>
                </ul>
              </div>
              <Image
                src="/actual-section.jpg"
                alt="image"
                width={320}
                height={160}
                className="rounded-lg"
              />
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-muted py-8 text-muted-foreground">
        <div className="container mx-auto max-w-4xl px-4 md:px-0">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div>
                  <h4 className="text-lg font-semibold">
                    Симаньков Никита Андреевич
                  </h4>
                  <p className="text-sm text-muted-foreground">Рядовой, ИТБ</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Электронная почта:</span>{" "}
                  <a href="#" className="hover:underline">
                    vch25849@mod.mil.by
                  </a>
                </div>
                <div>
                  <span className="font-medium">Номер телефона:</span>{" "}
                  <a href="#" className="hover:underline">
                    +375 (29) 877-35-97 - Псиохолог в/ч 25849 лейтенант А.Н.
                    Некрашевич
                  </a>
                  <br />
                </div>
              </div>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="text-lg font-semibold">Связь с разработчиком</h4>
                <p className="text-sm text-muted-foreground">
                  Есть вопрос или нуждаетесь в помощи? Свяжитесь со мной
                </p>
              </div>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Адрес:</span> г. Борисов, ул.
                  Братьев Вайнрубов 110к1, 222518
                </div>
                <div>
                  <span className="font-medium">Время:</span> Понедельник -
                  Пятница, 8:00 - 18:00
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
