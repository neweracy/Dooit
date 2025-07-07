import { FirebaseModel } from "./Firebase"

test("can be created", () => {
  const instance = FirebaseModel.create({})

  expect(instance).toBeTruthy()
})


