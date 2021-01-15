import { PodcastsService } from "./podcasts.service"
import { Test } from "@nestjs/testing";
import { Podcast } from "./entities/podcast.entity";
import { getRepositoryToken } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Episode } from "./entities/episode.entity";

const mockRepository = () => ({
    find: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn(),
    findOneOrFail: jest.fn(),
    delete: jest.fn()
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

describe('PodcastsService', () => {
    let service: PodcastsService;
    let podcastsRepository: MockRepository<Podcast>;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
          providers: [
            PodcastsService,
            {
              provide: getRepositoryToken(Podcast),
              useValue: mockRepository(),
            },
            {
                provide: getRepositoryToken(Episode),
                useValue: mockRepository(),
              },
        ]
        }).compile();
        service = module.get<PodcastsService>(PodcastsService);
        podcastsRepository = module.get(getRepositoryToken(Podcast));
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    describe('getAllPodcasts', () => {
        const args = {
            id: 1,
            createdAt: "2021-01-15T15:24:22.000Z",
            updatedAt: "2021-01-15T15:24:22.000Z",
            title: "test1",
            category: "category1",
            rating: 0
          };
        
        it('exist', async () => {
            podcastsRepository.find.mockResolvedValue(args);
            const result = await service.getAllPodcasts();
            expect(result).toEqual({
                ok: true,
                podcasts: args,
              });
        });

        it('error', async () => {
            podcastsRepository.find.mockRejectedValue(new Error());
            const result = await service.getAllPodcasts();
            expect(result).toEqual({
                ok: false,
                error: 'Internal server error occurred.',
              });
        });
    });

    describe('createPodcast', () => {
        const args = {
            title: 'title',
            category: "category",
          };
        
        it('create', async () => {
            podcastsRepository.create.mockResolvedValue(args);
            podcastsRepository.save.mockResolvedValue(args);
            const result = await service.createPodcast(args);

            expect(podcastsRepository.create).toHaveBeenCalledTimes(1);
            expect(podcastsRepository.create).toHaveBeenCalledWith(args);

            expect(podcastsRepository.save).toHaveBeenCalledTimes(1);
            expect(podcastsRepository.save).toHaveBeenCalledWith(args);
            expect(result).toEqual({ ok: true,result });
        });

        it('error', async () => {
            podcastsRepository.find.mockRejectedValue(new Error());
            const result = await service.getAllPodcasts();
            expect(result).toEqual({
                ok: false,
                error: 'Internal server error occurred.',
              });
        });
    })
});