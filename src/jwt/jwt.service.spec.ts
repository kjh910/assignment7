import { JwtService } from "./jwt.service";
import { Test } from "@nestjs/testing";
import * as jwt from 'jsonwebtoken';
import { CONFIG_OPTIONS } from './jwt.constants';

jest.mock('jsonwebtoken', () =>{
    return{
        sign: jest.fn(()=> 'TOKEN'),
    }
});

const TEST_KEY = 'testKey';
describe('JweService', () => {
    let service: JwtService;
    beforeEach(async() => {
        const module = await Test.createTestingModule({
            providers:[
                JwtService, {
                    provide:CONFIG_OPTIONS,
                    useValue:{
                        privateKey:'testKey'
                    }
                }
            ]
        }).compile();
        service = module.get<JwtService>(JwtService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('sign' , () => {
        it('should return a signed token', () => {
            const ID = 1;
            const token = service.sign(ID);
            expect(jwt.sign).toHaveBeenCalledTimes(1);
            expect(jwt.sign).toHaveBeenCalledWith({id:ID}, TEST_KEY); 
        })
    })

});